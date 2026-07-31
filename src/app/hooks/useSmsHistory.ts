import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { requestPage, type PageState } from "../lib/historyController";
import { reasonToCopy } from "../lib/historyReasons";
import type { HistoryMessage, MessageDirection } from "../lib/historyStream";

export type SmsDirection = MessageDirection;
export type SmsHistoryMessage = HistoryMessage;

/**
 * UI-facing status for the SSE history flow (tracks the FIRST page load):
 * - IDLE: no active request (missing inputs / panel closed)
 * - LOADING: first page in flight, waiting on the SSE event
 * - COMPLETED: at least one page received (possibly empty)
 * - FAILED: first page failed (gateway error, timeout, or terminal HTTP error)
 */
export type SmsHistoryStatus = "IDLE" | "LOADING" | "COMPLETED" | "FAILED";

export interface UseSmsHistoryResult {
  status: SmsHistoryStatus;
  /** Accumulated messages across all loaded pages, reassembled by pageNumber. */
  messages: SmsHistoryMessage[];
  /** Raw reason code of the most recent failure (for logic/telemetry). */
  failureReason: string | null;
  /** Human-readable copy for a failure, mapped via the Reason_Mapper. */
  error: string | null;
  /** True when the last loaded page was full, i.e. an older page may exist. */
  hasMore: boolean;
  /** True while a subsequent (page > 0) request is in flight. */
  loadingMore: boolean;
  /** Fetch the next older page. No-op if already loading or no more pages. */
  loadMore: () => void;
  /** Restart the flow from page 0 for the current inputs. */
  retry: () => void;
}

const PAGE_SIZE = 25;

/**
 * Owns the on-demand, paged SMS history flow for a single (apiId, deviceId,
 * address) over the SSE model. Loads page 0 immediately, then fetches older
 * pages one at a time via loadMore() to support infinite scroll. Thin adapter
 * over the framework-agnostic controller; it does NOT open/close the stream
 * (the dashboard shell owns that lifecycle).
 *
 * Race protection: each fresh input set gets a monotonically increasing runId;
 * stale async continuations are dropped so switching threads mid-flight never
 * surfaces a previous thread's messages.
 *
 * Pass `undefined` for any input to stay IDLE.
 */
export function useSmsHistory(
  apiId: string | undefined | null,
  deviceId: string | undefined | null,
  address: string | undefined | null,
): UseSmsHistoryResult {
  const { session } = useAuth();

  const [status, setStatus] = useState<SmsHistoryStatus>("IDLE");
  const [messages, setMessages] = useState<SmsHistoryMessage[]>([]);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const runIdRef = useRef(0);
  // pageNumber -> messages, so we can reassemble in ascending page order.
  const pagesRef = useRef<Map<number, SmsHistoryMessage[]>>(new Map());
  const nextPageRef = useRef(0);
  const loadingRef = useRef(false);
  const [retryToken, setRetryToken] = useState(0);

  const token = session?.access_token;
  const enabled = Boolean(token && apiId && deviceId && address);

  const flatten = (): SmsHistoryMessage[] => {
    const out: SmsHistoryMessage[] = [];
    for (const n of [...pagesRef.current.keys()].sort((a, b) => a - b)) {
      out.push(...pagesRef.current.get(n)!);
    }
    return out;
  };

  const loadPage = useCallback(
    async (pageNumber: number, myRun: number) => {
      if (loadingRef.current || runIdRef.current !== myRun || !enabled) return;
      loadingRef.current = true;
      const isFirst = pageNumber === 0;
      if (isFirst) setStatus("LOADING");
      else setLoadingMore(true);

      const fetchOnce = (): Promise<PageState> =>
        requestPage({
          apiId: apiId!,
          deviceId: deviceId!,
          to: address!,
          pageSize: PAGE_SIZE,
          pageNumber,
        });

      const stale = () => runIdRef.current !== myRun;

      try {
        let state = await fetchOnce();
        if (stale()) return;

        // 401: refresh the token once, then retry this page once.
        if (state.status === "error" && state.reason === "UNAUTHORIZED") {
          const refreshed = await supabase.auth.refreshSession();
          if (stale()) return;
          if (refreshed.data.session) {
            state = await fetchOnce();
            if (stale()) return;
          }
        }

        if (state.status === "loaded") {
          pagesRef.current.set(state.pageNumber, state.messages);
          nextPageRef.current = Math.max(
            nextPageRef.current,
            state.pageNumber + 1,
          );
          setMessages(flatten());
          setHasMore(state.messages.length >= PAGE_SIZE);
          setFailureReason(null);
          setError(null);
          setStatus("COMPLETED");
        } else if (state.status === "error") {
          setFailureReason(state.reason);
          setError(reasonToCopy(state.reason));
          // First-page failure is fatal for the view; a later-page failure just
          // stops paging (earlier pages remain visible).
          if (isFirst) setStatus("FAILED");
          setHasMore(false);
        }
      } finally {
        loadingRef.current = false;
        if (!isFirst) setLoadingMore(false);
      }
    },
    [enabled, apiId, deviceId, address],
  );

  const start = useCallback(() => {
    // Supersede any previous run and reset accumulated state.
    runIdRef.current += 1;
    const myRun = runIdRef.current;
    pagesRef.current = new Map();
    nextPageRef.current = 0;
    loadingRef.current = false;
    setMessages([]);
    setFailureReason(null);
    setError(null);
    setLoadingMore(false);
    setHasMore(false);

    if (!enabled) {
      setStatus("IDLE");
      return;
    }
    setStatus("LOADING");
    void loadPage(0, myRun);
  }, [enabled, loadPage]);

  useEffect(() => {
    start();
    return () => {
      // Invalidate the in-flight run so its resolution is ignored.
      runIdRef.current += 1;
    };
  }, [start, retryToken]);

  const loadMore = useCallback(() => {
    if (!enabled || loadingRef.current || !hasMore) return;
    void loadPage(nextPageRef.current, runIdRef.current);
  }, [enabled, hasMore, loadPage]);

  const retry = useCallback(() => setRetryToken((t) => t + 1), []);

  return {
    status,
    messages,
    failureReason,
    error,
    hasMore,
    loadingMore,
    loadMore,
    retry,
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getApiBaseUrl } from "../lib/api";

export type SmsDirection = "SENT" | "RECEIVED";

export interface SmsHistoryMessage {
  body: string;
  direction: SmsDirection;
  /** epoch milliseconds */
  timestamp: number;
}

/**
 * UI-facing status. Mirrors the server terminal states and adds:
 * - IDLE: no active request (missing inputs / panel closed)
 * - ERROR: network failure or non-2xx on the POST or a poll request
 */
export type SmsHistoryStatus =
  | "IDLE"
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "TIMEOUT"
  | "ERROR";

type ServerStatus = "PENDING" | "COMPLETED" | "FAILED" | "TIMEOUT";

interface JobResponse {
  jobId: string;
  status: ServerStatus;
  messages: SmsHistoryMessage[] | null;
  failureReason: string | null;
}

export interface UseSmsHistoryResult {
  status: SmsHistoryStatus;
  messages: SmsHistoryMessage[];
  failureReason: string | null;
  /** Human-readable error string for the ERROR state. */
  error: string | null;
  /** Restart the whole flow (new POST -> new poll). */
  retry: () => void;
}

const POLL_INTERVAL_MS = 2000;
/** Client-side safety net. Server caps device wait at 30s; give it a little slack. */
const POLL_CEILING_MS = 35000;
const GENERIC_ERROR = "Couldn't start history request";

const TERMINAL: ReadonlySet<ServerStatus> = new Set<ServerStatus>([
  "COMPLETED",
  "FAILED",
  "TIMEOUT",
]);

/**
 * Owns the on-demand SMS history flow for a single (apiId, deviceId, address):
 * POST to create a job, then poll until a terminal state.
 *
 * Race protection: every run gets a monotonically increasing runId. Any async
 * continuation checks it is still the current run before touching state or
 * scheduling more work, so switching threads mid-flight can never surface a
 * stale thread's messages or leave an orphaned poll loop alive.
 *
 * Pass `undefined` for any input to stay IDLE (and cancel any in-flight work).
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

  // Bumped on every start; identifies the "current" run.
  const runIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ceilingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Manual retry trigger.
  const [retryToken, setRetryToken] = useState(0);

  const clearTimers = useCallback(() => {
    if (pollTimerRef.current !== null) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (ceilingTimerRef.current !== null) {
      clearTimeout(ceilingTimerRef.current);
      ceilingTimerRef.current = null;
    }
  }, []);

  /** Cancel any in-flight fetch + scheduled work and mark all runs stale. */
  const cancel = useCallback(() => {
    runIdRef.current += 1;
    clearTimers();
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, [clearTimers]);

  const token = session?.access_token;

  const start = useCallback(() => {
    // Nothing to do without complete inputs / auth -> reset to IDLE.
    if (!token || !apiId || !deviceId || !address) {
      cancel();
      setStatus("IDLE");
      setMessages([]);
      setFailureReason(null);
      setError(null);
      return;
    }

    // Supersede any previous run.
    cancel();
    const myRun = runIdRef.current;
    const controller = new AbortController();
    abortRef.current = controller;

    const isCurrent = () => runIdRef.current === myRun;

    setStatus("PENDING");
    setMessages([]);
    setFailureReason(null);
    setError(null);

    const baseUrl = getApiBaseUrl();
    const authHeader = { Authorization: `Bearer ${token}` };

    const finishError = (message: string) => {
      if (!isCurrent()) return;
      clearTimers();
      setError(message);
      setStatus("ERROR");
    };

    const poll = async (jobId: string) => {
      if (!isCurrent()) return;
      let res: Response;
      try {
        res = await fetch(
          `${baseUrl}/api/messages/history/${encodeURIComponent(jobId)}`,
          { headers: { ...authHeader, Accept: "application/json" }, signal: controller.signal },
        );
      } catch (e) {
        if ((e as Error)?.name === "AbortError" || !isCurrent()) return;
        finishError("Lost connection while fetching messages.");
        return;
      }

      if (!isCurrent()) return;

      // 404 => job missing or not owned by this user. Non-2xx => generic error.
      if (!res.ok) {
        finishError(GENERIC_ERROR);
        return;
      }

      let data: JobResponse;
      try {
        data = (await res.json()) as JobResponse;
      } catch {
        finishError(GENERIC_ERROR);
        return;
      }

      if (!isCurrent()) return;

      if (TERMINAL.has(data.status)) {
        clearTimers();
        if (data.status === "COMPLETED") {
          setMessages(data.messages ?? []);
          setFailureReason(null);
          setStatus("COMPLETED");
        } else if (data.status === "FAILED") {
          setFailureReason(data.failureReason ?? null);
          setStatus("FAILED");
        } else {
          // TIMEOUT
          setFailureReason(null);
          setStatus("TIMEOUT");
        }
        return;
      }

      // Still PENDING -> schedule the next poll.
      pollTimerRef.current = setTimeout(() => {
        void poll(jobId);
      }, POLL_INTERVAL_MS);
    };

    const createJob = async () => {
      let res: Response;
      try {
        res = await fetch(`${baseUrl}/api/messages/history`, {
          method: "POST",
          headers: {
            ...authHeader,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ apiId, deviceId, address }),
          signal: controller.signal,
        });
      } catch (e) {
        if ((e as Error)?.name === "AbortError" || !isCurrent()) return;
        finishError(GENERIC_ERROR);
        return;
      }

      if (!isCurrent()) return;

      if (!res.ok) {
        // 404 (unowned apiId / missing device) or 403 (device not on apiId)
        // both surface the same generic message per the contract.
        finishError(GENERIC_ERROR);
        return;
      }

      let data: JobResponse;
      try {
        data = (await res.json()) as JobResponse;
      } catch {
        finishError(GENERIC_ERROR);
        return;
      }

      if (!isCurrent() || !data.jobId) {
        if (isCurrent()) finishError(GENERIC_ERROR);
        return;
      }

      // Arm the client-side ceiling as a safety net against endless PENDING.
      ceilingTimerRef.current = setTimeout(() => {
        if (!isCurrent()) return;
        clearTimers();
        setFailureReason(null);
        setStatus("TIMEOUT");
        controller.abort();
      }, POLL_CEILING_MS);

      void poll(data.jobId);
    };

    void createJob();
  }, [token, apiId, deviceId, address, cancel, clearTimers]);

  // Run whenever inputs change or a retry is requested.
  useEffect(() => {
    start();
    return () => {
      cancel();
    };
  }, [start, retryToken, cancel]);

  const retry = useCallback(() => {
    setRetryToken((t) => t + 1);
  }, []);

  return { status, messages, failureReason, error, retry };
}

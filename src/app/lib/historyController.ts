import {
  openHistoryStream,
  closeHistoryStream,
  type StreamAuth,
  type HistoryMessage,
} from "./historyStream";
import { getApiBaseUrl } from "./api";

const CLIENT_TIMEOUT_MS = 30_000;
// Must match the UI's PAGE_SIZE (see useSmsHistory) and the spec's valid range
// (Requirement 6.3: pageSize within 1..25 inclusive). If this is smaller than
// the hook's PAGE_SIZE, the "hasMore" check (messages.length >= PAGE_SIZE) can
// never be true, which permanently disables infinite scroll.
const MAX_PAGE_SIZE = 25;

export type PageState =
  | { status: "loading" }
  | { status: "loaded"; pageNumber: number; messages: HistoryMessage[] }
  | { status: "error"; reason: string };

export interface RequestPageArgs {
  apiId: string;
  deviceId: string;
  to: string;
  /** 1..25 */
  pageSize: number;
  /** 0-based */
  pageNumber: number;
}

// One entry per in-flight requestId.
interface Pending {
  address: string;
  pageNumber: number;
  timer: ReturnType<typeof setTimeout>;
  resolve: (state: PageState) => void;
  settled: boolean;
}

const pending = new Map<string, Pending>();

// Per-address serialization: a tail-promise chain keyed by address so a second
// request for the same address waits for the prior one to settle. Different
// addresses run concurrently.
const addressChains = new Map<string, Promise<unknown>>();

// Bound once via initHistoryController; used for every HTTP page request.
let streamAuth: StreamAuth | null = null;

// Optional: subscribe to update an external UI store.
type Listener = (requestId: string, state: PageState) => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(requestId: string, state: PageState) {
  listeners.forEach((l) => l(requestId, state));
}

/** The single resolution path. Idempotent and correlation-safe. */
function settle(requestId: string, state: PageState) {
  const p = pending.get(requestId);
  if (!p) return; // unknown id (e.g. event for another tab) => ignore
  if (p.settled) return; // duplicate event => resolve at most once
  p.settled = true;
  clearTimeout(p.timer);
  pending.delete(requestId);
  p.resolve(state);
  emit(requestId, state);
}

/** Call once after login, before requesting any pages. */
export function initHistoryController(auth: StreamAuth): void {
  streamAuth = auth;
  openHistoryStream(auth, {
    onResult: (e) =>
      settle(e.requestId, {
        status: "loaded",
        pageNumber: e.pageNumber,
        messages: e.messages,
      }),
    onError: (e) => settle(e.requestId, { status: "error", reason: e.reason }),
    onTimeout: (e) =>
      settle(e.requestId, { status: "error", reason: "REQUEST_TIMEOUT" }),
  });
}

/** Call on logout. */
export function disposeHistoryController(): void {
  pending.forEach((p) => clearTimeout(p.timer));
  pending.clear();
  addressChains.clear();
  streamAuth = null;
  closeHistoryStream();
}

/** Fires the GET request and resolves when the SSE event (or timeout) arrives. */
function sendPage(args: RequestPageArgs): Promise<PageState> {
  const requestId = crypto.randomUUID();
  const pageSize = Math.min(Math.max(Math.trunc(args.pageSize), 1), MAX_PAGE_SIZE);
  const pageNumber = Math.max(Math.trunc(args.pageNumber), 0);

  const url = new URL(`${getApiBaseUrl()}/api/messages/history`);
  url.searchParams.set("apiId", args.apiId);
  url.searchParams.set("deviceId", args.deviceId);
  url.searchParams.set("to", args.to);
  url.searchParams.set("requestId", requestId);
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("pageNumber", String(pageNumber));

  return new Promise<PageState>((resolve) => {
    const timer = setTimeout(
      () => settle(requestId, { status: "error", reason: "CLIENT_TIMEOUT" }),
      CLIENT_TIMEOUT_MS,
    );

    pending.set(requestId, {
      address: args.to,
      pageNumber,
      timer,
      resolve,
      settled: false,
    });
    emit(requestId, { status: "loading" });

    const token = streamAuth?.getToken() ?? "";
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.status === 202) return; // wait for SSE
        // Map non-202 to a terminal error immediately.
        const reason =
          res.status === 400
            ? "BAD_REQUEST"
            : res.status === 401
              ? "UNAUTHORIZED"
              : res.status === 403
                ? "FORBIDDEN"
                : res.status === 404
                  ? "NOT_FOUND"
                  : "HTTP_" + res.status;
        settle(requestId, { status: "error", reason });
      })
      .catch(() =>
        settle(requestId, { status: "error", reason: "NETWORK_ERROR" }),
      );
  });
}

/**
 * Fetch one page. Serialized per address: concurrent requests for the same
 * address are queued; different addresses run concurrently.
 */
export function requestPage(args: RequestPageArgs): Promise<PageState> {
  const prev = addressChains.get(args.to) ?? Promise.resolve();
  const next = prev.then(() => sendPage(args));
  // Keep the chain alive even if this link rejects (sendPage never rejects, but
  // guard anyway), and clean up the tail when this is the last link.
  const link = next.catch(() => undefined);
  addressChains.set(args.to, link);
  void link.then(() => {
    if (addressChains.get(args.to) === link) addressChains.delete(args.to);
  });
  return next;
}

// Note: pages are loaded incrementally (one at a time) by the UI via requestPage
// to power infinite scroll — see useSmsHistory. There is intentionally no
// "load everything up front" helper.

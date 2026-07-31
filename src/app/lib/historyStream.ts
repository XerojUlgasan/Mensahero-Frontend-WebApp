import {
  fetchEventSource,
  EventStreamContentType,
} from "@microsoft/fetch-event-source";
import { getApiBaseUrl } from "./api";

// ---- Event payload types (match the backend exactly) ----

export type MessageDirection = "SENT" | "RECEIVED";

export interface HistoryMessage {
  body: string;
  direction: MessageDirection;
  /** epoch milliseconds */
  timestamp: number;
}

export interface HistoryResultEvent {
  apiId: string;
  address: string;
  pageSize: number;
  pageNumber: number;
  requestId: string;
  messages: HistoryMessage[];
}

export type HistoryErrorReason =
  | "GATEWAY_FAILURE"
  | "PERMISSION_DENIED"
  | "DEVICE_NOT_FOUND"
  | "DEVICE_BUSY";

export interface HistoryErrorEvent {
  requestId: string;
  address: string;
  reason: HistoryErrorReason;
}

export interface HistoryTimeoutEvent {
  requestId: string;
  address: string;
}

/**
 * Bridges the Supabase-owned token to the framework-agnostic stream. The stream
 * never captures a token value at module load; it reads the current one on every
 * (re)connect so a refreshed JWT is always used.
 */
export interface StreamAuth {
  /** Returns the current access token, or null if unavailable. */
  getToken: () => string | null;
  /** Forces a token refresh; resolves with the new token or null on failure. */
  refreshToken: () => Promise<string | null>;
}

export interface StreamHandlers {
  onResult: (e: HistoryResultEvent) => void;
  onError: (e: HistoryErrorEvent) => void;
  onTimeout: (e: HistoryTimeoutEvent) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

/** Non-retriable auth failure so the library stops retrying and we can refresh. */
class FatalAuthError extends Error {}

/** Transient-retry delay handed back to fetch-event-source (ms). */
const RETRY_DELAY_MS = 3000;

let abortController: AbortController | null = null;

/**
 * Opens the single app-wide SSE connection to GET /api/events. Safe to call again
 * after logout/login. Automatically reconnects on transient errors and refreshes
 * the JWT on 401/403.
 */
export function openHistoryStream(
  auth: StreamAuth,
  handlers: StreamHandlers,
): void {
  // Never open two connections from the same manager instance.
  closeHistoryStream();
  abortController = new AbortController();

  const connect = () => {
    void fetchEventSource(`${getApiBaseUrl()}/api/events`, {
      signal: abortController!.signal,
      // Keep receiving events while the tab is backgrounded.
      openWhenHidden: true,
      // Built here (not captured once) so a reconnect always uses the freshest token.
      headers: {
        Authorization: `Bearer ${auth.getToken() ?? ""}`,
        Accept: "text/event-stream",
      },
      onopen: async (res) => {
        const ct = res.headers.get("content-type") ?? "";
        if (res.ok && ct.includes(EventStreamContentType)) {
          handlers.onConnected?.();
          return;
        }
        if (res.status === 401 || res.status === 403) {
          throw new FatalAuthError(`auth failed: ${res.status}`);
        }
        // Any other non-OK: throw so the library retries with backoff.
        throw new Error(`SSE open failed: ${res.status}`);
      },
      onmessage: (msg) => {
        if (!msg.data) return;
        switch (msg.event) {
          case "connected":
            break; // handshake; ignore
          case "history_result":
            handlers.onResult(JSON.parse(msg.data) as HistoryResultEvent);
            break;
          case "history_error":
            handlers.onError(JSON.parse(msg.data) as HistoryErrorEvent);
            break;
          case "request_timeout":
            handlers.onTimeout(JSON.parse(msg.data) as HistoryTimeoutEvent);
            break;
          default:
            break; // ignore unknown event names
        }
      },
      onclose: () => {
        // Server closed the stream; throw to trigger the library's retry.
        throw new Error("SSE closed by server");
      },
      onerror: (err) => {
        handlers.onDisconnected?.();
        if (err instanceof FatalAuthError) {
          // Refresh the token, then reconnect from scratch with the new one.
          auth
            .refreshToken()
            .then((token) => {
              if (token && abortController && !abortController.signal.aborted) {
                connect();
              }
            })
            .catch(() => {
              /* refresh failed => user must re-login; stop retrying */
            });
          // Throw to STOP the lib's own retry (which would reuse the OLD token);
          // we reconnect manually above.
          throw err;
        }
        // Transient error: return a delay (ms) to let the library retry.
        return RETRY_DELAY_MS;
      },
    }).catch(() => {
      /* aborted or fatal; manual reconnect (if any) handled in onerror */
    });
  };

  connect();
}

export function closeHistoryStream(): void {
  abortController?.abort();
  abortController = null;
}

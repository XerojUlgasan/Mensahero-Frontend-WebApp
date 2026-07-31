# Design Document

## Overview

This design migrates the web dashboard's on-demand SMS history from a polling model
(`POST /api/messages/history` + `GET /api/messages/history/{jobId}` polling) to a
Server-Sent Events (SSE) model. The browser opens **one** long-lived authenticated
SSE connection to `GET /api/events` per logged-in session. History page requests are
fired as `GET /api/messages/history` calls that return `202 Accepted` immediately;
the actual data (or an error/timeout) arrives asynchronously as an SSE event
correlated to the originating request by a client-generated `requestId`.

The design introduces three new client-side modules and rewrites one existing hook:

1. **`src/app/lib/historyStream.ts`** — the SSE connection manager (`SSE_Client`).
   Built on `@microsoft/fetch-event-source` because the native `EventSource` cannot
   send an `Authorization` header.
2. **`src/app/lib/historyController.ts`** — the framework-agnostic state store
   (`History_Module` + `Pending_Request_Registry` + `Timeout_Monitor` + page
   reassembly + per-address serialization). No React dependency.
3. **`src/app/lib/historyReasons.ts`** — the `Reason_Mapper` (reason code → copy).
4. **`src/app/hooks/useSmsHistory.ts`** — rewritten as a thin React adapter over the
   controller, preserving the existing return shape so `Messages.tsx` needs minimal
   change.

### Reconciliation with the integration document

The upstream integration doc uses placeholder imports (`@/config`, `@/auth`,
`getAccessToken()`, `refreshAccessToken()`). Those do **not** exist in this codebase.
This design binds the doc's abstract accessors to the real project primitives:

| Integration doc placeholder | This project's real primitive |
|-----------------------------|-------------------------------|
| `import { API_BASE } from '@/config'` | `getApiBaseUrl()` from `src/app/lib/api.ts` |
| `getAccessToken()` | `session.access_token` (Supabase `Session` from `AuthContext`) |
| `refreshAccessToken()` | `supabase.auth.refreshSession()` |

Because the Supabase token is owned by React context and can change on refresh, the
stream/controller must **never** capture a token value at module load. Instead they
receive a token provider callback so every (re)connect and every page request reads
the current token. This keeps `historyStream`/`historyController` framework-agnostic
(Requirement: framework-agnostic store) while integrating cleanly with Supabase auth.

## Architecture

```
┌─────────────────────────── Browser (one per session) ───────────────────────────┐
│                                                                                    │
│  AuthContext (Supabase session)                                                    │
│        │ token provider + refresh                                                  │
│        ▼                                                                            │
│  useSmsHistory (React adapter)                                                      │
│        │ requestPage(apiId, deviceId, to, pageSize, pageNumber)                     │
│        ▼                                                                            │
│  historyController  ── Pending_Request_Registry: Map<requestId, Pending>            │
│        │  - generates requestId (crypto.randomUUID)                                 │
│        │  - GET /api/messages/history  (202)  ──────────────────────────────┐      │
│        │  - starts 30s Timeout_Monitor per requestId                         │      │
│        │  - per-address serialization queue                                  │      │
│        │  - page reassembly by pageNumber                                    │      │
│        ▼                                                                     │      │
│  historyStream (SSE_Client)                                                  │      │
│        │  fetchEventSource GET /api/events  (Authorization: Bearer)          │      │
│        │  events: connected | history_result | history_error | request_timeout│     │
│        └── onResult/onError/onTimeout ──► historyController.settle(requestId) │      │
│                                                                              │      │
└──────────────────────────────────────────────────────────────────────────────────┘
                          │ SSE (held open)                    │ GET (202)
                          ▼                                     ▼
                        API  ──── FCM push ───►  Gateway phone ──┘
                          ▲                                     │
                          └──── POST .../history/result ◄───────┘
```

Two independent channels tied only by `requestId`:

- **Request channel:** `GET /api/messages/history` → `202 { requestId }` (no data).
- **Delivery channel:** the SSE `history_result` / `history_error` / `request_timeout`
  event carrying the same `requestId`.

### Lifecycle

- **Open:** `initHistoryController()` is called once when the authenticated app shell
  (the history UI) mounts (Req 2.1). It opens exactly one SSE connection (Req 2.4).
- **Close:** `disposeHistoryController()` is called on logout — aborts the SSE
  connection (Req 4.1) and clears the registry (Req 4.2).
- **Reconnect:** transient errors auto-retry with backoff (Req 3.3, 5.1); `401`
  triggers a token refresh then a manual reconnect (Req 3.1); other non-`200`
  statuses stop retries (Req 3.2).

### Multi-tab behavior

Each tab holds its own SSE connection and every tab receives **every** event for the
user. Correlation is purely by `requestId`; a tab drops events whose `requestId` is
not in its own `Pending_Request_Registry` (Req 12.2). This is why nothing is keyed by
address or thread at the transport layer.

## Components and Interfaces

### 1. `historyStream.ts` — SSE_Client

Owns the single `fetchEventSource` connection, header auth, reconnect/backoff, and
the `401` refresh-and-reconnect flow. It exposes typed event payloads and a handler
interface. It holds **no** pending state and does no correlation — that is the
controller's job.

```ts
// ---- Event payload types (match backend exactly) ----
export type MessageDirection = "SENT" | "RECEIVED";

export interface HistoryMessage {
  body: string;
  direction: MessageDirection;
  timestamp: number; // epoch milliseconds
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

export interface StreamAuth {
  /** Returns the current access token, or null if unavailable. */
  getToken: () => string | null;
  /** Forces a Supabase token refresh; resolves with the new token or null. */
  refreshToken: () => Promise<string | null>;
}

export interface StreamHandlers {
  onResult: (e: HistoryResultEvent) => void;
  onError: (e: HistoryErrorEvent) => void;
  onTimeout: (e: HistoryTimeoutEvent) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function openHistoryStream(auth: StreamAuth, handlers: StreamHandlers): void;
export function closeHistoryStream(): void;
```

Key implementation points (adapting §2.2 of the integration doc):

- Endpoint: `` `${getApiBaseUrl()}/api/events` `` (Req 2.1).
- Options: `openWhenHidden: true` (Req 2.2), `signal` from a module-level
  `AbortController`, header `Authorization: Bearer <getToken()>` and
  `Accept: text/event-stream` (Req 1.2, 2.1). The header is built inside `connect()`
  so a reconnect always uses the freshest token.
- `onopen`: `res.ok && content-type includes text/event-stream` ⇒ connected
  (Req 2.3, 3-nothing). `401` (and `403`) ⇒ throw a non-retriable `FatalAuthError`
  (Req 3.1/3.2). Any other non-OK ⇒ throw a plain `Error` so the library retries with
  backoff (Req 3.3).
- `onmessage`: dispatch by `msg.event`:
  - `connected` → `onConnected?.()`, no registry change (Req 2.5).
  - `history_result` → `handlers.onResult(JSON.parse(msg.data))`.
  - `history_error` → `handlers.onError(...)`.
  - `request_timeout` → `handlers.onTimeout(...)`.
  - unknown event names → ignored.
- `onclose`: throw to trigger the library's retry (Req 5.1).
- `onerror`:
  - `FatalAuthError` ⇒ call `auth.refreshToken()`, and on success reconnect manually
    (guarded by `!signal.aborted`); rethrow to stop the library retrying with the
    stale token (Req 3.1). On refresh failure, stop (user must re-login).
  - otherwise return `3000` (ms) to let the library retry with backoff (Req 3.3, 5.1).
- `closeHistoryStream()` aborts the controller and nulls it (Req 4.1). Calling
  `openHistoryStream` again first calls `closeHistoryStream()` to guarantee a single
  connection (Req 2.4).

> Note: `@microsoft/fetch-event-source`'s default retry already provides backoff for
> transient errors. Returning a fixed `3000` ms is an explicit, predictable backstop.

### 2. `historyController.ts` — History_Module

Framework-agnostic. Owns `Pending_Request_Registry`, `Timeout_Monitor`, correlation,
idempotent resolution, per-address serialization, and page reassembly.

```ts
const CLIENT_TIMEOUT_MS = 30_000;

export type PageState =
  | { status: "loading" }
  | { status: "loaded"; pageNumber: number; messages: HistoryMessage[] }
  | { status: "error"; reason: string };

export interface RequestPageArgs {
  apiId: string;
  deviceId: string;
  to: string;
  pageSize: number;  // 1..25
  pageNumber: number; // 0-based
}

/** Bind Supabase token access once, before opening the stream. */
export function initHistoryController(auth: StreamAuth): void;
export function disposeHistoryController(): void;

/** Fire one page request; resolves when its SSE event or a timeout arrives. */
export function requestPage(args: RequestPageArgs): Promise<PageState>;

/** Load consecutive pages for one address, in order, reassembled by pageNumber. */
export function requestThread(args: {
  apiId: string; deviceId: string; to: string;
  pageSize: number; maxPages: number;
}): Promise<HistoryMessage[]>;

/** Optional subscription for external UI stores. */
export function subscribe(fn: (requestId: string, state: PageState) => void): () => void;
```

Internal state:

```ts
interface Pending {
  address: string;
  pageNumber: number;
  timer: ReturnType<typeof setTimeout>;
  resolve: (state: PageState) => void;
  settled: boolean; // idempotency guard (Req 12.3)
}
const pending = new Map<string, Pending>();
// Per-address serialization: a tail-promise chain keyed by address (Req 14).
const addressChains = new Map<string, Promise<unknown>>();
```

Behavior mapping:

- **`requestPage`** (Req 6):
  1. `requestId = crypto.randomUUID()` (Req 6.1, UUID v4).
  2. Build URL `` `${getApiBaseUrl()}/api/messages/history` `` with query params
     `apiId, deviceId, to, requestId, pageSize, pageNumber` (Req 6.2). `pageSize` is
     asserted in `1..25` (Req 6.3, clamped/guarded before send); `pageNumber` sent as
     a 0-based integer (Req 6.4).
  3. Register the `Pending` entry (address + pageNumber) (Req 6.5) and start a 30s
     `Timeout_Monitor` timer (Req 11.1).
  4. `fetch(url, { headers: { Authorization: Bearer <getToken()> } })`:
     - `202` ⇒ leave pending; wait for SSE (Req 7.1).
     - `400` ⇒ settle error `BAD_REQUEST` (Req 7.2).
     - `403` ⇒ settle error `FORBIDDEN` (Req 7.4).
     - `404` ⇒ settle error `NOT_FOUND` (Req 7.3).
     - `401` ⇒ settle error `UNAUTHORIZED` (adapter handles refresh+retry once, see
       hook below).
     - other ⇒ `HTTP_<status>`; network throw ⇒ `NETWORK_ERROR`.
- **`settle(requestId, state)`** — the single resolution path:
  - Look up the entry; if absent, ignore (unknown/other-tab event, Req 12.2).
  - If `entry.settled` already true, ignore (duplicate event, Req 12.3).
  - Otherwise mark settled, `clearTimeout(timer)` (Req 8.4, 9.1, 10.2, 11.3), delete
    from the map, `resolve(state)`, and `emit`.
- **SSE handlers** wired in `initHistoryController` (Req 12.1):
  - `onResult` → `settle(e.requestId, { status:"loaded", pageNumber:e.pageNumber, messages:e.messages })` (Req 8.1–8.3).
  - `onError` → `settle(e.requestId, { status:"error", reason:e.reason })` (Req 9.1).
  - `onTimeout` → `settle(e.requestId, { status:"error", reason:"REQUEST_TIMEOUT" })` (Req 10.1).
- **`Timeout_Monitor` fire** → `settle(requestId, { status:"error", reason:"CLIENT_TIMEOUT" })` (Req 11.2, 5.2).
- **Per-address serialization** (Req 14): `requestPage` chains onto
  `addressChains.get(to)` so a second request for the same address waits for the
  prior one to settle; different addresses run concurrently (Req 14.2). The chain
  tail is cleaned up when it is the last pending link.
- **`requestThread`** (Req 13): loops `pageNumber = 0..maxPages-1`, awaiting each
  `requestPage`, stopping on the first non-`loaded` state or a short page
  (`messages.length < pageSize`), and concatenates results. Because it awaits each
  page and stores by `pageNumber`, ordering is correct regardless of SSE arrival
  order (Req 13.1, 13.2).
- **`disposeHistoryController`** clears all timers, empties the registry (Req 4.2),
  and calls `closeHistoryStream()` (Req 4.1).

### 3. `historyReasons.ts` — Reason_Mapper

```ts
export function reasonToCopy(reason: string): string {
  switch (reason) {
    case "PERMISSION_DENIED":
      return "The gateway phone hasn't allowed reading SMS. Grant SMS permission on the device.";
    case "DEVICE_NOT_FOUND":
      return "Couldn't reach the gateway device. Make sure it's online.";
    case "DEVICE_BUSY":
      return "The gateway is busy. Please try again.";
    case "GATEWAY_FAILURE":
      return "Couldn't load history. Please try again.";
    case "REQUEST_TIMEOUT":
    case "CLIENT_TIMEOUT":
      return "The gateway didn't respond in time. Please try again.";
    default:
      // Unknown reason ⇒ treat as GATEWAY_FAILURE (integration doc §4).
      return "Couldn't load history. Please try again.";
  }
}
```

Copy strings are reproduced **verbatim** from the integration document §4 (Req
9.2–9.6, Req 10.3). The doc is explicit: "Render this exact copy per reason — don't
invent your own." The `default` branch reuses the `GATEWAY_FAILURE` copy because the
doc says "Treat any unknown reason value as GATEWAY_FAILURE." Both the server
`request_timeout` event and the client backstop map to the exact timeout copy from
§4.

### 4. `useSmsHistory.ts` — React adapter (rewrite)

Preserves the existing public shape so `Messages.tsx` changes stay minimal:

```ts
export type SmsHistoryStatus = "IDLE" | "LOADING" | "COMPLETED" | "FAILED";

export interface UseSmsHistoryResult {
  status: SmsHistoryStatus;        // tracks the FIRST page load
  messages: SmsHistoryMessage[];   // accumulated across pages, reassembled by pageNumber
  failureReason: string | null;    // raw reason code (for logic)
  error: string | null;            // human copy via reasonToCopy
  hasMore: boolean;                // last loaded page was full → an older page may exist
  loadingMore: boolean;            // a page > 0 request is in flight
  loadMore: () => void;            // fetch the next older page (infinite scroll)
  retry: () => void;               // reload from page 0
}

export function useSmsHistory(
  apiId?: string | null,
  deviceId?: string | null,
  address?: string | null,
): UseSmsHistoryResult;
```

- Reads `session` from `useAuth()`. Builds the `StreamAuth` provider:
  `getToken: () => sessionRef.current?.access_token ?? null` and
  `refreshToken: async () => (await supabase.auth.refreshSession()).data.session?.access_token ?? null`.
  A `sessionRef` kept in sync via effect avoids stale closures on refresh.
- **Paged loading (Req 16):** on enable it requests **page 0 only** via `requestPage`.
  Loaded pages are stored in a `Map<pageNumber, HistoryMessage[]>` and exposed as
  `messages` flattened in ascending `pageNumber` order (Req 13, 16.4). `hasMore` is
  `true` when the last page returned exactly `pageSize` messages, else `false`
  (Req 16.2, 16.6). `loadMore()` requests `nextPage` (guarded by a `loadingRef` so at
  most one page is in flight), which the Messages scroll-up handler calls when the
  user reaches the top (Req 16.3). The `status` field reflects the **first** page
  load; subsequent pages use `loadingMore`.
- Uses a monotonically increasing `runId` so switching threads mid-flight never
  surfaces stale results; a new thread resets the page map and reloads page 0.
- `401` from the HTTP request: the adapter refreshes the token once via
  `supabase.auth.refreshSession()` and retries the same page once; a second `401`
  ends in `FAILED` (page 0) or stops paging (page > 0).
- A first-page failure sets `status = FAILED`; a later-page failure keeps the
  already-loaded pages visible and simply stops paging (`hasMore = false`).
- Removes all `jobId`, poll `setTimeout`, `POLL_INTERVAL_MS`, `POLL_CEILING_MS`,
  and the `PENDING/COMPLETED/FAILED/TIMEOUT` server-status enum (Req 15.1–15.3).

**Messages scroll integration (Req 16.3, 16.5):** the existing `handleMsgScroll`
(scroll-up-to-load-older) also triggers `loadMore()` when `historyEnabled &&
hasMore && !loadingMore`. Before calling it, the handler captures
`el.scrollHeight`; a `useEffect` keyed on `messages` restores the scroll offset by
the height delta so prepended older pages don't jump the viewport.

### 5. Ownership of `init`/`dispose`

`initHistoryController` must run once per session, not once per hook instance.
The design places the open/close in the authenticated app shell (the component that
renders the dashboard after login), via a small `useEffect`:

```tsx
useEffect(() => {
  if (!session) return;
  initHistoryController({
    getToken: () => sessionRef.current?.access_token ?? null,
    refreshToken: async () =>
      (await supabase.auth.refreshSession()).data.session?.access_token ?? null,
  });
  return () => disposeHistoryController();
}, [session?.user?.id]); // re-init only on identity change, not every token refresh
```

`useSmsHistory` then only calls `requestPage` (per page); it does not open or
close the stream. This satisfies "one connection per session" (Req 2.4) and "close on
logout" (Req 4.1) without coupling the connection to any thread/component
(integration doc §2.2 "When to open/close").

## Data Models

### Client-facing message

```ts
interface SmsHistoryMessage {
  body: string;
  direction: "SENT" | "RECEIVED";
  timestamp: number; // epoch milliseconds; display via new Date(timestamp)
}
```

`Messages.tsx` already consumes this exact shape (`historyMessages` merged into the
timeline), so the merge/dedupe logic there is unaffected apart from the status enum
change (`COMPLETED` retained as the "data ready" status).

### Pending registry entry

See `Pending` above. Keyed by `requestId`. One entry per in-flight page request;
removed on settle.

### Request → event correlation

`requestId` (UUID v4) is the only join key between the `GET` request and the SSE
event. It is generated client-side, echoed in the `202` body (used only to confirm),
and present on every `history_result` / `history_error` / `request_timeout` event.

## Error Handling

| Source | Condition | Handling | Requirement |
|--------|-----------|----------|-------------|
| SSE open | `200` + `text/event-stream` | connected | 2.3 |
| SSE open | `401` | `FatalAuthError` → refresh token → reconnect | 3.1 |
| SSE open | other non-`200` (incl. `403`) | throw → stop retry | 3.2 |
| SSE stream | transient / `onclose` | return `3000` ms → retry w/ backoff | 3.3, 5.1 |
| HTTP request | `202` | wait for SSE + start 30s timer | 7.1, 11.1 |
| HTTP request | `400` | settle `BAD_REQUEST` | 7.2 |
| HTTP request | `403` | settle `FORBIDDEN` | 7.4 |
| HTTP request | `404` | settle `NOT_FOUND` | 7.3 |
| HTTP request | `401` | adapter refresh + retry once, else `FAILED` | auth note |
| HTTP request | network throw | settle `NETWORK_ERROR` | — |
| SSE event | `history_error` | settle error w/ reason; map via Reason_Mapper | 9.1–9.6 |
| SSE event | `request_timeout` | settle `REQUEST_TIMEOUT` (failure) | 10.1 |
| Backstop | 30s timer elapses first | settle `CLIENT_TIMEOUT` | 5.2, 11.2 |
| Correlation | unknown `requestId` | ignore event | 12.2 |
| Correlation | duplicate event | `settled` guard → resolve at most once | 12.3 |

All settle paths clear the associated timer (Req 8.4, 9.1, 10.2, 11.3), guaranteeing
no orphaned timers and no double resolution.

## Testing Strategy

Manual/functional verification (no test framework is currently configured in the
project; setting one up is out of scope unless requested):

1. **Happy path:** open a thread with a valid active device → spinner → messages
   render merged into the timeline; `202` observed on the `GET`, `history_result`
   observed on the stream.
2. **Reason mapping:** simulate each `history_error.reason` → verify the exact copy
   from Requirement 9 and the `default` fallback for an unknown reason.
3. **Server timeout:** simulate `request_timeout` → thread resolves `FAILED` with the
   timeout copy; timer cancelled.
4. **Client backstop:** block the SSE delivery → after 30s the request resolves
   `CLIENT_TIMEOUT`; no hang.
5. **Multi-tab (Req 12 / doc §8):** open two tabs; request in tab A → both tabs
   receive the `history_result`; tab B ignores it (no state change), tab A resolves.
6. **Duplicate/late event:** re-deliver a `history_result` after settle → no second
   resolution (idempotency).
7. **Out-of-order pages:** `requestThread` with `maxPages > 1` where events arrive
   out of order → final list ordered by `pageNumber`.
8. **Serialization:** two rapid requests for the same address → second waits;
   requests for two different addresses run concurrently.
9. **Auth refresh:** expire the token → SSE `401` triggers refresh + reconnect; `GET`
   `401` triggers one refresh+retry.
10. **`pageSize` guard:** attempt `pageSize > 25` in code → guarded before send (never
    hits the `400` path in normal flow).
11. **Logout:** `disposeHistoryController` aborts the stream and clears the registry;
    no reconnect afterward.
12. **Build check:** `npm run build` (Vite) compiles with the new dependency and no
    `jobId`/poll references remain (`grep` for `jobId`, `POLL_`, `setInterval`).

## Correctness Properties

These invariants must hold for every execution of the design and are the basis for
verification.

### Property 1: Single connection per session

At any time during an authenticated session, at most one SSE connection to
`GET /api/events` is open from a given manager instance. `openHistoryStream` always
calls `closeHistoryStream` first, and the module-level `AbortController` is the sole
owner of the live connection.

**Validates: Requirements 2.4**

### Property 2: At-most-once resolution

For any `requestId`, `resolve` is called exactly once across all resolution sources
(SSE result/error/timeout, HTTP non-202, client backstop). The `settled` flag plus
map deletion guarantee no double resolution and no resolution of an already-settled
or unknown id.

**Validates: Requirements 12.2, 12.3**

### Property 3: No orphaned timers

Every `Timeout_Monitor` timer started for a `requestId` is cleared exactly once —
either by the resolving event or by its own firing (which itself settles). After
`disposeHistoryController`, no timer remains armed.

**Validates: Requirements 8.4, 9.1, 10.2, 11.3, 4.2**

### Property 4: Correlation soundness

A request is only ever resolved by an event carrying its own `requestId`; events for
absent ids are dropped without side effects. A tab never mutates state for another
tab's request.

**Validates: Requirements 12.1, 12.2**

### Property 5: Bounded waiting (liveness)

Every request that reaches `202` resolves within 30s: either an SSE event arrives
first, or the client backstop fires. No request waits indefinitely, even across
reconnects.

**Validates: Requirements 5.2, 11.1, 11.2**

### Property 6: Page-order determinism

For a completed `requestThread`, the concatenated message list is ordered by
ascending `pageNumber` regardless of SSE arrival order.

**Validates: Requirements 13.1, 13.2**

### Property 7: Per-address mutual exclusion

For a single address, no two history page requests are in flight simultaneously;
requests for distinct addresses are not serialized against each other.

**Validates: Requirements 14.1, 14.2**

### Property 8: Token freshness

Every (re)connect and every HTTP request reads the current token via the provider; no
stale token captured at module load is ever sent. On `401`, a refresh precedes any
reconnect/retry.

**Validates: Requirements 3.1, 1.2, 6.2**

### Property 9: No legacy paths

After migration, no code path issues `POST /api/messages/history`, polls
`GET /api/messages/history/{jobId}`, or reads poll-derived status enums.

**Validates: Requirements 15.1, 15.2, 15.3**

## Requirements Traceability

| Requirement | Design element |
|-------------|----------------|
| 1 SSE dependency | `@microsoft/fetch-event-source` install; `historyStream` header auth |
| 2 Opening stream | `openHistoryStream` (endpoint, `openWhenHidden`, connected check, single connection, handshake) |
| 3 Auth errors | `historyStream` `onopen`/`onerror` (`FatalAuthError`, refresh, backoff) |
| 4 Closing | `closeHistoryStream` + `disposeHistoryController` (clear registry) |
| 5 Reconnect / lost requests | backoff retry + 30s `CLIENT_TIMEOUT` backstop |
| 6 Requesting a page | `requestPage` (UUID v4, query params, pageSize 1–25, 0-based page, registry record) |
| 7 HTTP responses | `requestPage` status mapping (202/400/403/404) |
| 8 Success results | `onResult` → `settle(loaded)`; timestamp ms; direction enum; timer cancel |
| 9 Gateway errors | `onError` → `settle(error)`; `historyReasons.reasonToCopy` |
| 10 Server timeouts | `onTimeout` → `settle(REQUEST_TIMEOUT)`; timer cancel |
| 11 Client backstop | 30s `Timeout_Monitor` per requestId; cancel on any resolving event |
| 12 Correlation | `settle` keyed by `requestId`; unknown ignored; `settled` idempotency |
| 13 Page reassembly | `requestThread` sequential-by-pageNumber assembly |
| 14 Serialization | per-address promise chain; different addresses concurrent |
| 15 Migration | rewritten `useSmsHistory`; removed `jobId`/poll/status enum |
| 16 Incremental paging | `useSmsHistory` page-0-then-`loadMore`; `hasMore`/`loadingMore`; Messages scroll-up trigger + scroll preservation |

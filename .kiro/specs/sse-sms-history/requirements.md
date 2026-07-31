# Requirements Document

## Introduction

This feature replaces the web dashboard's polling-based on-demand SMS history mechanism with a Server-Sent Events (SSE) based approach. No SMS history is persisted on the backend: the web app sends a fire-and-forget request that is relayed over FCM to the user's gateway phone, and the resulting messages (or an error/timeout) are delivered asynchronously to the browser over a single long-lived SSE stream. Results are correlated back to their originating request through a client-generated `requestId`.

The scope is the web application only (the `WebApp` directory). The Android gateway is covered by a separate document. The existing polling implementation in `src/app/hooks/useSmsHistory.ts` (POST + `jobId` polling) and its consumption in `src/app/pages/app/Messages.tsx` will be migrated to the SSE model. This work adds the `@microsoft/fetch-event-source` dependency, opens one authenticated SSE connection per logged-in session, initiates paged history requests, correlates and reassembles asynchronous results, and removes all legacy polling and `jobId` logic.

## Glossary

- **Web_App**: The MensaHERO React web dashboard front end that consumes the SMS history feature.
- **SSE_Client**: The fetch-based Server-Sent Events client (built on `@microsoft/fetch-event-source`) that maintains the long-lived connection to `GET /api/events` and dispatches received events.
- **History_Module**: The client-side module (successor to `useSmsHistory`) that initiates history page requests, tracks pending requests, and exposes history state to the UI.
- **Pending_Request_Registry**: The in-memory client-side map keyed by `requestId` that records each in-flight history request and its state.
- **Timeout_Monitor**: The client-side per-request timer that acts as a backstop when no SSE result arrives.
- **Reason_Mapper**: The client-side component that maps a `history_error` reason code to human-readable copy.
- **Request_Id**: A client-generated UUID version 4 string that correlates a history page request with its asynchronous SSE result.
- **History_Result_Event**: An SSE event with event name `history_result` carrying a successful page of messages.
- **History_Error_Event**: An SSE event with event name `history_error` carrying a gateway failure reason.
- **Request_Timeout_Event**: An SSE event with event name `request_timeout` indicating the server gave up waiting for the gateway.
- **Connected_Event**: An SSE event with event name `connected` that serves as a handshake acknowledgment.
- **Access_Token**: The Supabase JWT bearer token supplied through the authenticated session.
- **Gateway_Device**: The Android phone that reads SMS from its local store and returns history over FCM.
- **Message_Direction**: An enumerated value that is either `SENT` or `RECEIVED`.
- **History_Message**: A single SMS record with fields `body` (string), `direction` (Message_Direction), and `timestamp` (epoch milliseconds).
- **Address**: The phone number or address whose SMS history is being fetched.
- **Page_Size**: An integer count of messages requested per page, valid range 1 to 25 inclusive.
- **Page_Number**: A 0-based integer index identifying which page of history is requested.

## Requirements

### Requirement 1: SSE Client Dependency

**User Story:** As a developer, I want an SSE client capable of sending an authorization header, so that the web app can authenticate the event stream that native EventSource cannot.

#### Acceptance Criteria

1. THE Web_App SHALL include the `@microsoft/fetch-event-source` package as a project dependency.
2. THE SSE_Client SHALL send the Access_Token in an `Authorization: Bearer` request header when connecting to the event stream.

### Requirement 2: Opening the Event Stream

**User Story:** As a logged-in user, I want a single event stream opened for my session, so that I receive all my SMS history results in the browser.

#### Acceptance Criteria

1. WHEN a user is authenticated and the history user interface mounts, THE SSE_Client SHALL open one connection to `GET /api/events` with the Access_Token in the `Authorization: Bearer` header.
2. THE SSE_Client SHALL set the connection option `openWhenHidden` to `true`.
3. WHEN the connection response status is `200` and the response `Content-Type` header includes `text/event-stream`, THE SSE_Client SHALL transition to a connected state.
4. WHILE a user session is active, THE SSE_Client SHALL maintain exactly one open connection to `GET /api/events` for that session.
5. WHEN a Connected_Event is received, THE SSE_Client SHALL treat the event as a handshake acknowledgment and SHALL make no change to any Pending_Request_Registry entry.

### Requirement 3: Event Stream Authentication Errors

**User Story:** As a logged-in user, I want the event stream to recover from an expired token, so that my history keeps working across long sessions.

#### Acceptance Criteria

1. IF the connection response status is `401` or `403`, THEN THE SSE_Client SHALL treat it as an authentication failure, request an Access_Token refresh, and reopen the connection using the refreshed Access_Token.
2. IF the connection response status is not `200`, not `401`, and not `403`, THEN THE SSE_Client SHALL raise a connection error and SHALL retry with backoff.
3. IF a stream error other than an authentication failure occurs, THEN THE SSE_Client SHALL allow automatic reconnection with backoff.

### Requirement 4: Closing the Event Stream

**User Story:** As a user who logs out, I want the event stream closed, so that no stale connection remains for my session.

#### Acceptance Criteria

1. WHEN the user logs out, THE SSE_Client SHALL close the connection to `GET /api/events`.
2. WHEN the connection is closed on logout, THE History_Module SHALL clear all entries in the Pending_Request_Registry.

### Requirement 5: Reconnection and Lost In-Flight Requests

**User Story:** As a user with an unstable network, I want in-flight requests that are lost during a reconnect to still resolve, so that the interface does not hang indefinitely.

#### Acceptance Criteria

1. WHEN the network connection drops, THE SSE_Client SHALL attempt to reconnect automatically with backoff.
2. IF a history request is in flight while the connection is unavailable and no SSE event arrives for that Request_Id, THEN THE Timeout_Monitor SHALL resolve that request as failed with the reason code `CLIENT_TIMEOUT`.

### Requirement 6: Requesting a Page of History

**User Story:** As a user, I want to request a page of SMS history for an address, so that the gateway phone returns those messages to the browser.

#### Acceptance Criteria

1. WHEN a history page request is initiated, THE History_Module SHALL generate a new Request_Id as a UUID version 4.
2. WHEN a history page request is initiated, THE History_Module SHALL send `GET /api/messages/history` with the Access_Token in the `Authorization: Bearer` header and with query parameters `apiId`, `deviceId`, `to`, `requestId`, `pageSize`, and `pageNumber`.
3. THE History_Module SHALL send a `pageSize` value within the range 1 to 25 inclusive.
4. THE History_Module SHALL send a 0-based integer as the `pageNumber` value.
5. WHEN a history page request is sent, THE History_Module SHALL record the Request_Id and its associated Address and Page_Number in the Pending_Request_Registry.

### Requirement 7: History Request HTTP Responses

**User Story:** As a user, I want the request acknowledgment handled correctly, so that the interface waits for results or surfaces an accurate error.

#### Acceptance Criteria

1. WHEN the `GET /api/messages/history` response status is `202`, THE History_Module SHALL keep the Request_Id pending and SHALL start the Timeout_Monitor for that Request_Id.
2. IF the `GET /api/messages/history` response status is `400`, THEN THE History_Module SHALL resolve that request as failed and SHALL surface a bad-parameters error to the user.
3. IF the `GET /api/messages/history` response status is `404`, THEN THE History_Module SHALL resolve that request as failed and SHALL surface a not-found error to the user.
4. IF the `GET /api/messages/history` response status is `403`, THEN THE History_Module SHALL resolve that request as failed and SHALL surface a device-mismatch error to the user.

### Requirement 8: Handling Successful History Results

**User Story:** As a user, I want successful history results displayed for the correct address, so that I can read the gateway phone's messages.

#### Acceptance Criteria

1. WHEN a History_Result_Event is received whose `requestId` matches a Pending_Request_Registry entry, THE History_Module SHALL resolve that request as successful and SHALL store the returned History_Message list against that Request_Id.
2. THE History_Module SHALL represent each History_Message `timestamp` as epoch milliseconds.
3. THE History_Module SHALL represent each History_Message `direction` as a Message_Direction value of either `SENT` or `RECEIVED`.
4. WHEN a History_Result_Event is resolved, THE Timeout_Monitor SHALL cancel the timer associated with that Request_Id.

### Requirement 9: Handling Gateway Errors

**User Story:** As a user, I want gateway failures shown as friendly messages, so that I understand why history could not be loaded.

#### Acceptance Criteria

1. WHEN a History_Error_Event is received whose `requestId` matches a Pending_Request_Registry entry, THE History_Module SHALL resolve that request as failed and SHALL cancel the Timeout_Monitor timer for that Request_Id.
2. WHEN the History_Error_Event reason is `PERMISSION_DENIED`, THE Reason_Mapper SHALL produce the copy "The gateway phone hasn't allowed reading SMS. Grant SMS permission on the device."
3. WHEN the History_Error_Event reason is `DEVICE_NOT_FOUND`, THE Reason_Mapper SHALL produce the copy "Couldn't reach the gateway device. Make sure it's online."
4. WHEN the History_Error_Event reason is `DEVICE_BUSY`, THE Reason_Mapper SHALL produce the copy "The gateway is busy. Please try again."
5. WHEN the History_Error_Event reason is `GATEWAY_FAILURE`, THE Reason_Mapper SHALL produce the copy "Couldn't load history. Please try again."
6. IF the History_Error_Event reason is not one of the recognized reason codes, THEN THE Reason_Mapper SHALL produce the copy "Couldn't load history. Please try again."

### Requirement 10: Handling Server Timeouts

**User Story:** As a user, I want the interface to react to a server-declared timeout, so that a stalled gateway request stops waiting.

#### Acceptance Criteria

1. WHEN a Request_Timeout_Event is received whose `requestId` matches a Pending_Request_Registry entry, THE History_Module SHALL resolve that request as failed for that Request_Id.
2. WHEN a Request_Timeout_Event is resolved, THE Timeout_Monitor SHALL cancel the timer associated with that Request_Id.
3. WHEN a request is resolved as failed due to a Request_Timeout_Event, THE Reason_Mapper SHALL produce the copy "The gateway didn't respond in time. Please try again."

### Requirement 11: Client-Side Timeout Backstop

**User Story:** As a user, I want a client-side timeout backstop, so that the interface never waits forever when the SSE connection is dropped.

#### Acceptance Criteria

1. WHEN a history request is acknowledged with status `202`, THE Timeout_Monitor SHALL start a timer of 30 seconds for that Request_Id.
2. IF the Timeout_Monitor timer for a Request_Id elapses before any SSE event resolves that Request_Id, THEN THE History_Module SHALL resolve that request as failed with the reason code `CLIENT_TIMEOUT`.
3. WHEN any resolving SSE event for a Request_Id is received before the Timeout_Monitor timer elapses, THE Timeout_Monitor SHALL cancel the timer for that Request_Id.

### Requirement 12: Event Correlation

**User Story:** As a user with multiple open tabs, I want each tab to react only to its own requests, so that events meant for another tab are ignored.

#### Acceptance Criteria

1. WHEN a History_Result_Event, History_Error_Event, or Request_Timeout_Event is received, THE History_Module SHALL match the event to a pending request by its `requestId`.
2. IF a received History_Result_Event, History_Error_Event, or Request_Timeout_Event carries a `requestId` that is absent from the Pending_Request_Registry, THEN THE History_Module SHALL ignore the event.
3. WHEN the same SSE event for a Request_Id is received more than once, THE History_Module SHALL resolve that Request_Id at most one time.

### Requirement 13: Page Reassembly

**User Story:** As a user, I want history pages assembled in the correct order, so that messages read correctly even when pages arrive out of order.

#### Acceptance Criteria

1. THE History_Module SHALL order received history pages by their `pageNumber` value.
2. WHEN history pages for the same Address arrive in an order different from their `pageNumber` sequence, THE History_Module SHALL reassemble the pages by `pageNumber` rather than by arrival order.

### Requirement 14: Serializing Concurrent Requests

**User Story:** As a user, I want repeated history requests for the same address serialized, so that concurrent requests for one address do not overlap.

#### Acceptance Criteria

1. WHILE a history request for an Address is pending, THE History_Module SHALL delay sending a new history page request for that same Address until the pending request is resolved.
2. THE History_Module SHALL allow history requests for different Addresses to be in flight concurrently.

### Requirement 15: Migration From the Polling API

**User Story:** As a developer, I want the legacy polling implementation removed, so that the web app relies solely on the SSE model.

#### Acceptance Criteria

1. THE History_Module SHALL remove the `POST /api/messages/history` job-creation request.
2. THE History_Module SHALL remove the `GET /api/messages/history/{jobId}` poll request and all `jobId` handling.
3. THE History_Module SHALL remove the poll-based status states `PENDING`, `COMPLETED`, `FAILED`, and `TIMEOUT` that were derived from poll responses.
4. WHERE the Messages user interface consumes history state, THE Web_App SHALL present history status derived from the SSE event model instead of the removed poll-based states.

### Requirement 16: Incremental Paging (Infinite Scroll)

**User Story:** As a user, I want device history to load page by page as I scroll, so that I can browse older messages on demand without fetching everything at once.

#### Acceptance Criteria

1. WHEN a history view is opened for an Address, THE History_Module SHALL request only Page_Number `0` initially.
2. WHILE the most recently loaded page for an Address returned exactly Page_Size messages, THE History_Module SHALL treat older pages as potentially available.
3. WHEN the user scrolls to the top of the message list AND older pages are potentially available AND no page request for that Address is in flight, THE Web_App SHALL request the next sequential Page_Number.
4. WHEN an additional page of history is loaded, THE History_Module SHALL append it to the accumulated messages reassembled by Page_Number.
5. WHEN older history pages are prepended to the list, THE Web_App SHALL preserve the user's scroll position relative to the previously visible content.
6. IF the most recently loaded page returned fewer than Page_Size messages, THEN THE History_Module SHALL treat the history as fully loaded and SHALL stop requesting further pages.

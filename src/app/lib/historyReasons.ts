/**
 * Reason_Mapper: maps a history_error reason code (or a client-side terminal
 * reason) to user-facing copy. Strings are reproduced verbatim from the SSE
 * integration document §4 — do not invent your own copy.
 */
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
      // Unknown reason => treat as GATEWAY_FAILURE (integration doc §4).
      return "Couldn't load history. Please try again.";
  }
}

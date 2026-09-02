import { defineEventHandler, getHeader, createError } from "nitro/h3";

/**
 * Middleware to enforce presence of a valid unified API key.
 * The key must be set via the server‑only environment variable OMNI_UNIFIED_KEY.
 * It should be sent by clients in the `x-unified-key` header.
 */
export function withAuth(handler: (event: any) => any) {
  return defineEventHandler(async (event) => {
    const provided = getHeader(event, "x-unified-key");
    const expected = process.env.OMNI_UNIFIED_KEY;
    if (!expected) {
      throw createError({
        statusCode: 500,
        statusMessage: "Server misconfiguration: OMNI_UNIFIED_KEY not set",
      });
    }
    if (!provided || provided !== expected) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid or missing unified API key",
      });
    }
    return handler(event);
  });
}

import { defineEventHandler, getHeader, createError } from "nitro/h3";

// Simple in‑memory rate limiter per IP address
const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT = 10; // maximum requests per window
const WINDOW_MS = 60 * 1000; // 1 minute window

/**
 * Middleware to enforce a valid unified API key and basic rate limiting.
 * The unified key is set via the server‑only environment variable OMNI_UNIFIED_KEY.
 * Clients must send it in the `x-unified-key` header.
 */
export function withAuth(handler: (event: any) => any) {
  return defineEventHandler(async (event) => {
    // ----- Rate limiting -----
    const ip = getHeader(event, "x-forwarded-for") || (event.node?.req?.socket?.remoteAddress as string) || "unknown";
    const now = Date.now();
    const timestamps = rateLimitStore.get(ip) ?? [];
    // Keep only timestamps within the window
    const recent = timestamps.filter((ts) => now - ts < WINDOW_MS);
    recent.push(now);
    rateLimitStore.set(ip, recent);
    if (recent.length > RATE_LIMIT) {
      throw createError({ statusCode: 429, statusMessage: "Too many requests" });
    }

    // ----- Unified API key check -----
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

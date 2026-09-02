import { defineEventHandler, getHeader, createError } from "nitro/h3";

const RATE_LIMIT = 10; // requests
const WINDOW_MS = 60 * 1000; // 1 minute
const store = new Map<string, number[]>(); // IP → timestamps

export default defineEventHandler(async (event) => {
  const ip = getHeader(event, "x-forwarded-for") ||
    (event.node?.req?.socket?.remoteAddress as string) ||
    "unknown";

  const now = Date.now();
  const timestamps = store.get(ip) ?? [];

  // keep only timestamps inside the current window
  const recent = timestamps.filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  store.set(ip, recent);

  if (recent.length > RATE_LIMIT) {
    throw createError({ statusCode: 429, statusMessage: "Too many requests – please slow down." });
  }

  // allow the request to continue
  return;
});
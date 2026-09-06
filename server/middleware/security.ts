import { defineEventHandler, getHeader, createError } from "nitro/h3";

// Security headers configuration
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
};

// Rate limiting configuration
const RATE_LIMIT = 100; // requests per minute
const rateLimits = new Map<string, { count: number; timestamp: number }>();

export default defineEventHandler(async (event) => {
  // Apply security headers
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    event.node.res.setHeader(header, value);
  }

  // Enhanced rate limiting
  const ip = getHeader(event, "x-forwarded-for") ||
    event.node.req.socket.remoteAddress ||
    "unknown";

  const now = Date.now();

  if (rateLimits.has(ip)) {
    const { count, timestamp } = rateLimits.get(ip)!;
    if (now - timestamp < 60000 && count >= RATE_LIMIT) {
      throw createError({ statusCode: 429, statusMessage: "Too many requests" });
    }
    rateLimits.set(ip, { count: count + 1, timestamp: now });
  } else {
    rateLimits.set(ip, { count: 1, timestamp: now });
  }

  // Enhanced request validation
  const method = event.node.req.method;
  const url = event.node.req.url;

  // Block potentially dangerous methods
  if (method === "TRACE" || method === "TRACK") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  // Block requests with suspicious patterns
  if (url && (url.includes("<script>") || url.includes("javascript:"))) {
    throw createError({ statusCode: 400, statusMessage: "Malicious request detected" });
  }

  // Enhanced CORS configuration
  const origin = getHeader(event, "origin");
  if (origin) {
    // Validate the origin against allowed domains
    const allowedOrigins = [process.env.ALLOWED_ORIGIN || "http://localhost:3000"];
    if (allowedOrigins.includes(origin)) {
      event.node.res.setHeader("Access-Control-Allow-Origin", origin);
      event.node.res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      event.node.res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
  }

  // Continue processing the request
  return;
});
import { defineEventHandler, getHeader } from "nitro/h3";

// Comprehensive security headers configuration
const SECURITY_HEADERS = {
  // Content Security Policy
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';",

  // Strict-Transport-Security
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",

  // X-Content-Type-Options
  "X-Content-Type-Options": "nosniff",

  // X-Frame-Options
  "X-Frame-Options": "DENY",

  // X-XSS-Protection
  "X-XSS-Protection": "1; mode=block",

  // Referrer-Policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions-Policy
  "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=(), usb=(), midi=(), sync-xhr=(), magnetometer=(), gyroscope=(), fullscreen=(self), vibrate=()",

  // Cross-Origin-Opener-Policy
  "Cross-Origin-Opener-Policy": "same-origin",

  // Cross-Origin-Resource-Policy
  "Cross-Origin-Resource-Policy": "same-origin",

  // Cross-Origin-Embedder-Policy
  "Cross-Origin-Embedder-Policy": "require-corp",

  // Expect-CT
  "Expect-CT": "max-age=86400, enforce",

  // Feature-Policy (deprecated but still used by some browsers)
  "Feature-Policy": "geolocation 'none'; microphone 'none'; camera 'none'; payment 'none'; usb 'none'; midi 'none'; sync-xhr 'none'; magnetometer 'none'; gyroscope 'none'; fullscreen 'self'; vibrate 'none';",

  // Additional security headers
  "X-Download-Options": "noopen",
  "X-Permitted-Cross-Domain-Policies": "none",
  "X-DNS-Prefetch-Control": "off",
  "X-Powered-By": "OmniLLM",
  "Server": "OmniLLM Server"
};

export default defineEventHandler(async (event) => {
  // Apply security headers
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    event.node.res.setHeader(header, value);
  }

  // Enhanced CORS configuration
  const origin = getHeader(event, "origin");
  if (origin) {
    // Validate the origin against allowed domains
    const allowedOrigins = [
      process.env.ALLOWED_ORIGIN || "http://localhost:3000",
      "https://your-production-domain.com"
    ];

    if (allowedOrigins.includes(origin)) {
      event.node.res.setHeader("Access-Control-Allow-Origin", origin);
      event.node.res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
      event.node.res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
      event.node.res.setHeader("Access-Control-Allow-Credentials", "true");
      event.node.res.setHeader("Access-Control-Max-Age", "86400");
    }
  }

  // Handle preflight requests
  if (event.node.req.method === "OPTIONS") {
    event.node.res.statusCode = 204;
    event.node.res.end();
    return;
  }

  // Continue processing the request
  return;
});
import { defineEventHandler, getHeader, createError } from "nitro/h3";

// Enhanced rate limiting configuration
const RATE_LIMIT_CONFIG = {
  // Default rate limits
  default: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later"
  },

  // Specific routes with custom limits
  routes: {
    "/api/proxy": {
      windowMs: 60 * 1000,
      max: 20, // More restrictive for proxy endpoint
      message: "Too many requests to the proxy endpoint, please slow down"
    },
    "/api/auth": {
      windowMs: 60 * 1000,
      max: 10, // Very restrictive for auth endpoint
      message: "Too many authentication attempts, please try again later"
    }
  },

  // IP whitelisting
  whitelist: [
    "127.0.0.1", // Localhost
    "::1" // IPv6 localhost
  ],

  // IP blacklisting
  blacklist: [
    // Add known malicious IPs here
  ]
};

// In-memory store for rate limiting
const rateLimits = new Map<string, { count: number; timestamp: number }>();

export default defineEventHandler(async (event) => {
  // Skip rate limiting for whitelisted IPs
  const ip = getHeader(event, "x-forwarded-for") ||
    event.node.req.socket.remoteAddress ||
    "unknown";

  if (RATE_LIMIT_CONFIG.whitelist.includes(ip)) {
    return;
  }

  // Check if IP is blacklisted
  if (RATE_LIMIT_CONFIG.blacklist.includes(ip)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Access denied"
    });
  }

  // Determine the rate limit configuration for the current route
  const path = event.node.req.url?.split('?')[0] || "";
  const routeConfig = Object.entries(RATE_LIMIT_CONFIG.routes).find(([route]) => path.startsWith(route))?.[1];
  const config = routeConfig || RATE_LIMIT_CONFIG.default;

  // Check rate limit
  const now = Date.now();

  if (rateLimits.has(ip)) {
    const { count, timestamp } = rateLimits.get(ip)!;

    // Reset the counter if the window has passed
    if (now - timestamp > config.windowMs) {
      rateLimits.set(ip, { count: 1, timestamp: now });
    } else {
      // Increment the counter
      if (count >= config.max) {
        throw createError({
          statusCode: 429,
          statusMessage: config.message,
          headers: {
            "Retry-After": Math.ceil((timestamp + config.windowMs - now) / 1000).toString()
          }
        });
      }

      rateLimits.set(ip, { count: count + 1, timestamp });
    }
  } else {
    // Initialize the counter for this IP
    rateLimits.set(ip, { count: 1, timestamp: now });
  }

  // Continue processing the request
  return;
});
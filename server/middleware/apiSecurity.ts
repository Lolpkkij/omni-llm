import { defineEventHandler, getHeader, createError } from "nitro/h3";
import { validateUrl } from "../utils/validation";

// API security configuration
const API_SECURITY_CONFIG = {
  // API key validation
  apiKey: {
    required: true,
    headerName: "X-API-Key",
    allowedKeys: [
      process.env.API_KEY || "default-api-key-change-in-production"
    ]
  },

  // Request validation
  request: {
    maxBodySize: "1mb", // Maximum request body size
    allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    forbiddenHeaders: [
      "X-Forwarded-Host",
      "X-Forwarded-Server",
      "X-Original-URL",
      "X-Rewrite-URL"
    ]
  },

  // Response validation
  response: {
    sanitizeHeaders: true,
    forbiddenHeaders: [
      "Server",
      "X-Powered-By",
      "X-AspNet-Version",
      "X-AspNetMvc-Version"
    ]
  },

  // CSRF protection
  csrf: {
    enabled: true,
    cookieName: "__Host-csrf-token",
    headerName: "X-CSRF-Token",
    methods: ["POST", "PUT", "PATCH", "DELETE"]
  }
};

export default defineEventHandler(async (event) => {
  // Skip API security for specific routes
  const path = event.node.req.url?.split('?')[0] || "";
  const skipPaths = ["/api/auth", "/api/health"];
  if (skipPaths.some(p => path.startsWith(p))) {
    return;
  }

  // Validate API key if required
  if (API_SECURITY_CONFIG.apiKey.required) {
    const apiKey = getHeader(event, API_SECURITY_CONFIG.apiKey.headerName);

    if (!apiKey || !API_SECURITY_CONFIG.apiKey.allowedKeys.includes(apiKey)) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid API key"
      });
    }
  }

  // Validate HTTP method
  const method = event.node.req.method;
  if (!method || !API_SECURITY_CONFIG.request.allowedMethods.includes(method)) {
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed"
    });
  }

  // Validate request headers
  const headers = event.node.req.headers;
  for (const header of API_SECURITY_CONFIG.request.forbiddenHeaders) {
    if (headers[header.toLowerCase()]) {
      throw createError({
        statusCode: 400,
        statusMessage: `Forbidden header: ${header}`
      });
    }
  }

  // Validate request body size
  if (method === "POST" || method === "PUT" || method === "PATCH") {
    const contentLength = headers["content-length"];
    if (contentLength) {
      const maxSize = parseSize(API_SECURITY_CONFIG.request.maxBodySize);
      if (parseInt(contentLength) > maxSize) {
        throw createError({
          statusCode: 413,
          statusMessage: `Request body too large (max: ${API_SECURITY_CONFIG.request.maxBodySize})`
        });
      }
    }
  }

  // CSRF protection
  if (API_SECURITY_CONFIG.csrf.enabled && API_SECURITY_CONFIG.csrf.methods.includes(method)) {
    const cookieHeader = getHeader(event, "cookie") || "";
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=').map(decodeURIComponent);
      acc[name] = value;
      return acc;
    }, {} as Record<string, string>);

    const csrfToken = cookies[API_SECURITY_CONFIG.csrf.cookieName];
    const csrfHeader = getHeader(event, API_SECURITY_CONFIG.csrf.headerName);

    if (!csrfToken || csrfToken !== csrfHeader) {
      throw createError({
        statusCode: 403,
        statusMessage: "CSRF token validation failed"
      });
    }
  }

  // Validate Referer header if present
  const referer = getHeader(event, "referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (!validateUrl(refererUrl.toString())) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid Referer header"
        });
      }
    } catch {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid Referer header"
      });
    }
  }

  // Continue processing the request
  return;
});

// Helper function to parse size strings (e.g., "1mb" to bytes)
function parseSize(size: string): number {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };

  const match = size.match(/^(\d+)([a-z]+)$/i);
  if (!match) {
    throw new Error("Invalid size format");
  }

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase() as keyof typeof units;

  if (!units[unit]) {
    throw new Error("Invalid size unit");
  }

  return value * units[unit];
}
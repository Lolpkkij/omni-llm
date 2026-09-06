import { defineEventHandler, getHeader } from "nitro/h3";
import { securityLogger } from "../utils/securityLogger";

// Security logging configuration
const SECURITY_LOG_CONFIG = {
  logSensitiveHeaders: false,
  logRequestBody: false,
  logResponseBody: false
};

export default defineEventHandler(async (event) => {
  // Skip logging for specific routes
  const path = event.node.req.url?.split('?')[0] || "";
  const skipPaths = ["/api/health", "/api/logs"];
  if (skipPaths.some(p => path.startsWith(p))) {
    return;
  }

  // Log request details
  const ip = getHeader(event, "x-forwarded-for") ||
    event.node.req.socket.remoteAddress ||
    "unknown";

  const userAgent = getHeader(event, "user-agent") || "unknown";
  const method = event.node.req.method || "unknown";
  const url = event.node.req.url || "unknown";

  // Log the request
  securityLogger.info("Incoming request", {
    ip,
    userAgent,
    method,
    url,
    headers: SECURITY_LOG_CONFIG.logSensitiveHeaders ? event.node.req.headers : "[REDACTED]"
  });

  // Log request body if enabled
  if (SECURITY_LOG_CONFIG.logRequestBody && (method === "POST" || method === "PUT" || method === "PATCH")) {
    try {
      const body = await readRawBody(event);
      if (body) {
        securityLogger.info("Request body", {
          ip,
          method,
          url,
          body: body.toString()
        });
      }
    } catch (error) {
      securityLogger.error("Failed to log request body", { error });
    }
  }

  // Continue processing the request
  return;
});

// Helper function to read raw request body
async function readRawBody(event: any): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    event.node.req.on("data", (chunk: Buffer) => chunks.push(chunk));
    event.node.req.on("end", () => resolve(Buffer.concat(chunks)));
    event.node.req.on("error", () => resolve(null));
  });
}
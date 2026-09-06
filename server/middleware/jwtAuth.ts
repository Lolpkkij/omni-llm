import { defineEventHandler, getHeader, createError } from "nitro/h3";
import { verifyToken } from "../utils/jwt";
import { securityLogger } from "../utils/securityLogger";

// JWT authentication configuration
const JWT_AUTH_CONFIG = {
  // Routes that require authentication
  protectedRoutes: [
    "/api/proxy",
    "/api/providers",
    "/api/usage",
    "/api/v1"
  ],

  // Skip authentication for these routes
  skipRoutes: [
    "/api/auth",
    "/api/health",
    "/api/v1/models"
  ],

  // Header name for the JWT token
  tokenHeader: "Authorization",

  // Token prefix (e.g., "Bearer ")
  tokenPrefix: "Bearer "
};

export default defineEventHandler(async (event) => {
  // Skip authentication for specific routes
  const path = event.node.req.url?.split('?')[0] || "";
  if (JWT_AUTH_CONFIG.skipRoutes.some(p => path.startsWith(p))) {
    return;
  }

  // Check if the route requires authentication
  const requiresAuth = JWT_AUTH_CONFIG.protectedRoutes.some(p => path.startsWith(p));
  if (!requiresAuth) {
    return;
  }

  // Get the token from the header
  const authHeader = getHeader(event, JWT_AUTH_CONFIG.tokenHeader);
  if (!authHeader || !authHeader.startsWith(JWT_AUTH_CONFIG.tokenPrefix)) {
    securityLogger.warning("Missing or invalid Authorization header", { path });
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: Missing or invalid token"
    });
  }

  // Extract the token
  const token = authHeader.replace(JWT_AUTH_CONFIG.tokenPrefix, "");

  try {
    // Verify the token
    const decoded = verifyToken(token);

    // Set the user ID on the event context for downstream handlers
    event.context.userId = decoded.userId;

    // Log successful authentication
    securityLogger.info("JWT authentication successful", {
      userId: decoded.userId,
      path
    });
  } catch (error) {
    securityLogger.warning("JWT authentication failed", {
      error,
      path
    });

    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: Invalid or expired token"
    });
  }

  // Continue processing the request
  return;
});
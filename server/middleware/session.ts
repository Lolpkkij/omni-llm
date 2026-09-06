import { defineEventHandler, getHeader, createError } from "nitro/h3";
import { useRuntimeConfig } from "nitro";

// Session configuration
const SESSION_CONFIG = {
  sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
  cookieName: "__Secure-session",
  cookieOptions: {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 24 * 60 * 60, // 24 hours
    path: "/",
    domain: process.env.COOKIE_DOMAIN || "localhost"
  },
  secret: process.env.SESSION_SECRET || "default-secret-change-in-production"
};

// In-memory session store (in production, use a database)
const sessions = new Map<string, { userId: string; expiresAt: number }>();

export default defineEventHandler(async (event) => {
  // Skip session management for specific routes
  const path = event.node.req.url?.split('?')[0] || "";
  const skipPaths = ["/api/auth", "/api/health"];
  if (skipPaths.some(p => path.startsWith(p))) {
    return;
  }

  // Get the session cookie
  const cookieHeader = getHeader(event, "cookie") || "";
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=').map(decodeURIComponent);
    acc[name] = value;
    return acc;
  }, {} as Record<string, string>);

  const sessionId = cookies[SESSION_CONFIG.cookieName];

  // Validate the session
  if (sessionId) {
    const session = sessions.get(sessionId);

    if (session) {
      // Check if session is expired
      if (session.expiresAt < Date.now()) {
        // Session expired, clear it
        sessions.delete(sessionId);
        event.node.res.setHeader("Set-Cookie", `${SESSION_CONFIG.cookieName}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`);
        throw createError({
          statusCode: 401,
          statusMessage: "Session expired"
        });
      }

      // Refresh the session
      session.expiresAt = Date.now() + SESSION_CONFIG.sessionDuration;
      sessions.set(sessionId, session);

      // Set the user ID on the event context for downstream handlers
      event.context.userId = session.userId;

      // Continue processing the request
      return;
    }
  }

  // No valid session found
  throw createError({
    statusCode: 401,
    statusMessage: "Unauthorized"
  });
});

// Helper function to create a new session
export const createSession = (userId: string): string => {
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_CONFIG.sessionDuration;

  sessions.set(sessionId, { userId, expiresAt });

  return sessionId;
};

// Helper function to set the session cookie
export const setSessionCookie = (sessionId: string, res: any) => {
  const cookieValue = `${SESSION_CONFIG.cookieName}=${sessionId}; Max-Age=${SESSION_CONFIG.cookieOptions.maxAge}; Path=${SESSION_CONFIG.cookieOptions.path}; HttpOnly; Secure; SameSite=${SESSION_CONFIG.cookieOptions.sameSite}`;

  if (SESSION_CONFIG.cookieOptions.domain) {
    cookieValue += `; Domain=${SESSION_CONFIG.cookieOptions.domain}`;
  }

  res.setHeader("Set-Cookie", cookieValue);
};

// Helper function to clear the session
export const clearSession = (res: any) => {
  res.setHeader("Set-Cookie", `${SESSION_CONFIG.cookieName}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`);
};
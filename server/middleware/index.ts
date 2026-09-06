import securityHeaders from "./securityHeaders";
import rateLimit from "./rateLimit";
import apiSecurity from "./apiSecurity";
import dataProtection from "./dataProtection";
import session from "./session";
import jwtAuth from "./jwtAuth";
import securityLogger from "./securityLogger";

export default defineEventHandler(async (event) => {
  // Apply security headers
  await securityHeaders(event);

  // Apply rate limiting
  await rateLimit(event);

  // Apply API security
  await apiSecurity(event);

  // Apply data protection
  await dataProtection(event);

  // Apply session management
  await session(event);

  // Apply JWT authentication
  await jwtAuth(event);

  // Apply security logging
  await securityLogger(event);

  // Continue processing the request
  return;
});
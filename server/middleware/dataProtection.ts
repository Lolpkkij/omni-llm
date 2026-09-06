import { defineEventHandler, getHeader, createError } from "nitro/h3";
import { encryptData, decryptData } from "../utils/encryption";

// Data protection configuration
const DATA_PROTECTION_CONFIG = {
  // Sensitive headers to redact
  sensitiveHeaders: [
    "authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "x-auth-token",
    "x-csrf-token"
  ],

  // Sensitive query parameters to redact
  sensitiveQueryParams: [
    "api_key",
    "access_token",
    "refresh_token",
    "password",
    "secret"
  ],

  // Sensitive request body fields to redact
  sensitiveBodyFields: [
    "password",
    "credit_card",
    "ssn",
    "api_key",
    "access_token",
    "refresh_token"
  ],

  // Data encryption settings
  encryption: {
    enabled: true,
    algorithm: "AES-256-GCM",
    key: process.env.ENCRYPTION_KEY || "default-encryption-key-change-in-production"
  },

  // Data masking settings
  masking: {
    enabled: true,
    maskCharacter: "*",
    minLength: 4
  }
};

export default defineEventHandler(async (event) => {
  // Skip data protection for specific routes
  const path = event.node.req.url?.split('?')[0] || "";
  const skipPaths = ["/api/auth", "/api/health"];
  if (skipPaths.some(p => path.startsWith(p))) {
    return;
  }

  // Redact sensitive headers
  if (DATA_PROTECTION_CONFIG.masking.enabled) {
    const headers = event.node.req.headers;
    for (const header of DATA_PROTECTION_CONFIG.sensitiveHeaders) {
      if (headers[header]) {
        headers[header] = maskData(headers[header]);
      }
    }
  }

  // Redact sensitive query parameters
  if (DATA_PROTECTION_CONFIG.masking.enabled) {
    const url = event.node.req.url || "";
    const queryIndex = url.indexOf("?");
    if (queryIndex !== -1) {
      const queryString = url.substring(queryIndex + 1);
      const queryParams = new URLSearchParams(queryString);

      for (const param of DATA_PROTECTION_CONFIG.sensitiveQueryParams) {
        if (queryParams.has(param)) {
          queryParams.set(param, maskData(queryParams.get(param)!));
        }
      }

      // Update the URL with redacted query parameters
      event.node.req.url = url.substring(0, queryIndex + 1) + queryParams.toString();
    }
  }

  // Encrypt sensitive data in the request body
  if (DATA_PROTECTION_CONFIG.encryption.enabled) {
    const contentType = getHeader(event, "content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        const body = await readRawBody(event);
        if (body) {
          const parsedBody = JSON.parse(body.toString());
          const encryptedBody = encryptSensitiveData(parsedBody);
          event.node.req.body = encryptedBody;
        }
      } catch (error) {
        console.error("Error processing request body:", error);
      }
    }
  }

  // Continue processing the request
  return;
});

// Helper function to mask sensitive data
function maskData(data: string): string {
  if (!data || data.length <= DATA_PROTECTION_CONFIG.masking.minLength) {
    return data;
  }

  const visibleChars = Math.max(2, DATA_PROTECTION_CONFIG.masking.minLength);
  const maskedPart = DATA_PROTECTION_CONFIG.masking.maskCharacter.repeat(data.length - visibleChars);
  return data.substring(0, visibleChars) + maskedPart;
}

// Helper function to encrypt sensitive data in an object
function encryptSensitiveData(obj: any): any {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  const encryptedObj: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (DATA_PROTECTION_CONFIG.sensitiveBodyFields.includes(key.toLowerCase())) {
      // Encrypt sensitive field
      encryptedObj[key] = encryptData(obj[key], DATA_PROTECTION_CONFIG.encryption.key);
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      // Recursively process nested objects
      encryptedObj[key] = encryptSensitiveData(obj[key]);
    } else {
      // Leave other fields unchanged
      encryptedObj[key] = obj[key];
    }
  }

  return encryptedObj;
}

// Helper function to read raw request body
async function readRawBody(event: any): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    event.node.req.on("data", (chunk: Buffer) => chunks.push(chunk));
    event.node.req.on("end", () => resolve(Buffer.concat(chunks)));
    event.node.req.on("error", () => resolve(null));
  });
}
// Security configuration
export const SECURITY_CONFIG = {
  // Authentication settings
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET || "default-jwt-secret-change-in-production",
      expiresIn: "1h",
      algorithm: "HS256",
      issuer: "omni-llm",
      audience: "omni-llm-api"
    },
    session: {
      duration: 24 * 60 * 60 * 1000, // 24 hours
      cookieName: "__Secure-session",
      cookieOptions: {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60, // 24 hours
        path: "/",
        domain: process.env.COOKIE_DOMAIN || "localhost"
      },
      secret: process.env.SESSION_SECRET || "default-session-secret-change-in-production"
    }
  },

  // Encryption settings
  encryption: {
    algorithm: "AES-256-GCM",
    key: process.env.ENCRYPTION_KEY || "default-encryption-key-change-in-production"
  },

  // Security headers
  headers: {
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';",
    strictTransportSecurity: "max-age=63072000; includeSubDomains; preload",
    xContentTypeOptions: "nosniff",
    xFrameOptions: "DENY",
    xXSSProtection: "1; mode=block",
    referrerPolicy: "strict-origin-when-cross-origin",
    permissionsPolicy: "geolocation=(), microphone=(), camera=(), payment=(), usb=(), midi=(), sync-xhr=(), magnetometer=(), gyroscope=(), fullscreen=(self), vibrate=()",
    crossOriginOpenerPolicy: "same-origin",
    crossOriginResourcePolicy: "same-origin",
    crossOriginEmbedderPolicy: "require-corp",
    expectCT: "max-age=86400, enforce",
    featurePolicy: "geolocation 'none'; microphone 'none'; camera 'none'; payment 'none'; usb 'none'; midi 'none'; sync-xhr 'none'; magnetometer 'none'; gyroscope 'none'; fullscreen 'self'; vibrate 'none';",
    additionalHeaders: {
      "X-Download-Options": "noopen",
      "X-Permitted-Cross-Domain-Policies": "none",
      "X-DNS-Prefetch-Control": "off",
      "X-Powered-By": "OmniLLM",
      "Server": "OmniLLM Server"
    }
  },

  // Rate limiting
  rateLimiting: {
    default: {
      windowMs: 60 * 1000, // 1 minute
      max: 100, // limit each IP to 100 requests per windowMs
      message: "Too many requests from this IP, please try again later"
    },
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
    whitelist: [
      "127.0.0.1", // Localhost
      "::1" // IPv6 localhost
    ],
    blacklist: [
      // Add known malicious IPs here
    ]
  },

  // API security
  apiSecurity: {
    apiKey: {
      required: true,
      headerName: "X-API-Key",
      allowedKeys: [
        process.env.API_KEY || "default-api-key-change-in-production"
      ]
    },
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
    response: {
      sanitizeHeaders: true,
      forbiddenHeaders: [
        "Server",
        "X-Powered-By",
        "X-AspNet-Version",
        "X-AspNetMvc-Version"
      ]
    },
    csrf: {
      enabled: true,
      cookieName: "__Host-csrf-token",
      headerName: "X-CSRF-Token",
      methods: ["POST", "PUT", "PATCH", "DELETE"]
    }
  },

  // Data protection
  dataProtection: {
    sensitiveHeaders: [
      "authorization",
      "cookie",
      "set-cookie",
      "x-api-key",
      "x-auth-token",
      "x-csrf-token"
    ],
    sensitiveQueryParams: [
      "api_key",
      "access_token",
      "refresh_token",
      "password",
      "secret"
    ],
    sensitiveBodyFields: [
      "password",
      "credit_card",
      "ssn",
      "api_key",
      "access_token",
      "refresh_token"
    ],
    encryption: {
      enabled: true,
      algorithm: "AES-256-GCM",
      key: process.env.ENCRYPTION_KEY || "default-encryption-key-change-in-production"
    },
    masking: {
      enabled: true,
      maskCharacter: "*",
      minLength: 4
    }
  },

  // Security logging
  securityLogging: {
    logDirectory: "logs/security",
    maxLogSize: 10 * 1024 * 1024, // 10MB
    maxLogFiles: 5,
    logLevels: {
      INFO: "INFO",
      WARNING: "WARNING",
      ERROR: "ERROR",
      CRITICAL: "CRITICAL"
    },
    logSensitiveHeaders: false,
    logRequestBody: false,
    logResponseBody: false
  }
};
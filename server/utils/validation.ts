import { z } from "zod";

// Enhanced URL validation with security checks
export const validateUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);

    // Block common dangerous protocols
    const forbiddenProtocols = ["file:", "javascript:", "data:", "vbscript:"];
    if (forbiddenProtocols.includes(parsedUrl.protocol)) {
      return false;
    }

    // Block localhost and private IP addresses
    const forbiddenHosts = [
      "localhost",
      "127.0.0.1",
      "::1",
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./
    ];

    if (forbiddenHosts.some(host =>
      typeof host === "string" ? parsedUrl.hostname === host : host.test(parsedUrl.hostname)
    )) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

// Enhanced API key validation
export const validateApiKey = (key: string): boolean => {
  // Basic length check
  if (key.length < 32) return false;

  // Check for common patterns
  const commonPatterns = [
    /^[A-Za-z0-9]{32,}$/, // Simple alphanumeric
    /^sk-[A-Za-z0-9]{48}$/, // OpenAI pattern
    /^sk-proj-[A-Za-z0-9]{48}$/, // OpenAI project pattern
    /^sk-[A-Za-z0-9]{24}$/, // Anthropic pattern
    /^AIza[0-9A-Za-z-_]{35}$/, // Google pattern
    /^[A-Za-z0-9]{24}$/, // Groq pattern
    /^[A-Za-z0-9]{32}$/ // Mistral pattern
  ];

  return commonPatterns.some(pattern => pattern.test(key));
};

// Enhanced message validation
export const validateMessage = (message: any): boolean => {
  const schema = z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().min(1).max(4096),
    timestamp: z.number().optional(),
    id: z.string().optional(),
    isEditing: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
    isLoading: z.boolean().optional(),
    error: z.string().optional()
  });

  try {
    schema.parse(message);
    return true;
  } catch {
    return false;
  }
};

// Enhanced provider configuration validation
export const validateProviderConfig = (config: any): boolean => {
  const schema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    baseUrl: z.string().url().refine(validateUrl, {
      message: "Invalid or unsafe URL"
    }),
    auth: z.object({
      type: z.enum(["header", "query", "body"]),
      keyName: z.string().min(1).max(100),
      prefix: z.string().optional()
    }),
    encryptedKeys: z.array(z.string().min(1)),
    providerType: z.enum(["openai", "anthropic", "gemini", "groq", "mistral", "custom"]).optional(),
    usage: z.object({
      tokensThisMonth: z.number().nonnegative(),
      spentUSD: z.number().nonnegative(),
      models: z.array(z.object({
        name: z.string().min(1),
        tokens: z.number().nonnegative()
      }))
    }).optional(),
    health: z.object({
      status: z.enum(["online", "offline", "unknown"]),
      latency: z.number().optional(),
      lastChecked: z.number().optional(),
      error: z.string().optional()
    }).optional(),
    detectedModel: z.string().optional(),
    enabled: z.boolean().default(true),
    order: z.number().int().optional(),
    modelPath: z.string().optional()
  });

  try {
    schema.parse(config);
    return true;
  } catch {
    return false;
  }
};
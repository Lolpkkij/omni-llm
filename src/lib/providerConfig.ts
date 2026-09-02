import { z } from "zod";

export const ProviderUsageSchema = z.object({
  tokensThisMonth: z.number(),
  spentUSD: z.number(),
  models: z.array(z.object({
    name: z.string(),
    tokens: z.number(),
  })),
});

export type ProviderUsage = z.infer<typeof ProviderUsageSchema>;

export const ProviderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  baseUrl: z.string().url().refine((val) => val.startsWith("https://"), {
    message: "Base URL must use HTTPS for security",
  }),
  auth: z.object({
    type: z.enum(["header", "query", "body"]),
    keyName: z.string().min(1),
    prefix: z.string().optional(),
  }),
  encryptedKeys: z.array(z.string()),
  providerType: z.enum(["openai", "anthropic", "gemini", "custom"]).optional(),
  usage: ProviderUsageSchema.optional(),
  detectedModel: z.string().optional(),
  enabled: z.boolean().default(true),
  order: z.number().int().optional(),
  /** Optional custom path for model‑list endpoint (e.g. "/v1/models") */
  modelPath: z.string().optional(),
});

export type Provider = z.infer<typeof ProviderSchema>;

/**
 * Validates that a URL does not point to local or private network addresses to prevent SSRF.
 */
export function isSafeUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    if (url.protocol !== "https:") return false;
    
    const hostname = url.hostname;
    // Block localhost, loopback, and private IP ranges
    const forbiddenPatterns = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
    ];

    return !forbiddenPatterns.some(pattern => 
      typeof pattern === "string" ? hostname === pattern : pattern.test(hostname)
    );
  } catch {
    return false;
  }
}
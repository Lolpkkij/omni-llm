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

export const ProviderHealthSchema = z.object({
  status: z.enum(["online", "offline", "unknown"]),
  latency: z.number().optional(),
  lastChecked: z.number().optional(),
  error: z.string().optional(),
});

export type ProviderHealth = z.infer<typeof ProviderHealthSchema>;

export const ProviderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  baseUrl: z.string().url().refine((val) => val.startsWith("https://") || val.includes("localhost") || val.includes("127.0.0.1"), {
    message: "Base URL must be valid",
  }),
  auth: z.object({
    type: z.enum(["header", "query", "body"]),
    keyName: z.string().min(1),
    prefix: z.string().optional(),
  }),
  encryptedKeys: z.array(z.string()),
  providerType: z.enum(["openai", "anthropic", "gemini", "groq", "mistral", "custom"]).optional(),
  usage: ProviderUsageSchema.optional(),
  health: ProviderHealthSchema.optional(),
  detectedModel: z.string().optional(),
  enabled: z.boolean().default(true),
  order: z.number().int().optional(),
  modelPath: z.string().optional(),
});

export type ProviderConfig = z.infer<typeof ProviderSchema>;

export function isSafeUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname;

    // Explicitly allow common local dev addresses if the user adds them
    if (["localhost", "127.0.0.1"].includes(hostname)) return true;

    const forbiddenPatterns = [
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
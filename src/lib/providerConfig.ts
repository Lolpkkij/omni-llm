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
  baseUrl: z.string().url(),
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
});

export type Provider = z.infer<typeof ProviderSchema>;
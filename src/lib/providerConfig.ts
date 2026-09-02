import { z } from "zod";

export const ProviderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  baseUrl: z.string().url(),
  auth: z.object({
    type: z.enum(["header", "query", "body"]),
    keyName: z.string().min(1),
    prefix: z.string().optional(),   // e.g. "Bearer "
  }),
  encryptedKeys: z.array(z.string()), // each key is stored encrypted
  providerType: z.enum(["openai","anthropic","gemini","custom"]).optional(),
  enabled: z.boolean().default(true),
  order: z.number().int().optional(),
});

export type Provider = z.infer<typeof ProviderSchema>;
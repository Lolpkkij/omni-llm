import { z } from "zod";

export const ProviderSchema = z.object({
  id: z.string().uuid(),                     // internal ID
  name: z.string().min(1),                   // display name
  baseUrl: z.string().url(),                // e.g. https://api.openai.com/v1
  modelPath: z.string().min(1).default("/chat/completions"),
  auth: z.object({
    type: z.enum(["header", "query", "body"]), // where the key goes
    keyName: z.string().min(1),                // header name, query param, or JSON field
    prefix: z.string().optional(),             // e.g. "Bearer "
  }),
  // Optional request-body template as a stringified function
  bodyTemplate: z.string().optional(),
  // List of encrypted API keys (AES-encrypted strings)
  encryptedKeys: z.array(z.string()),
  // Provider-specific flags
  flags: z.object({
    supportsUsage: z.boolean().default(false),
  }).optional(),
  enabled: z.boolean().default(true),
  order: z.number().int().optional(), // UI ordering
});

export type ProviderConfig = z.infer<typeof ProviderSchema>;
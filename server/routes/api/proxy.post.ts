import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import CryptoJS from "crypto-js";
import { getAllProviders } from "../../utils/providerStore";

// Global In-Memory Cache (Reset on server restart)
const RESPONSE_CACHE = new Map<string, { content: string; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export default defineHandler(async (event) => {
  const body = await readBody<{
    provider: string;
    model: string;
    messages: any[];
    params?: {
      temperature: number;
      maxTokens: number;
      topP: number;
      useCache: boolean;
    };
  }>(event);

  const { provider: providerId, model, messages, params } = body;

  if (!providerId || !model || !messages) {
    throw createError({ statusCode: 400, statusMessage: "Missing required parameters" });
  }

  // --- Cache Check ---
  const cacheKey = CryptoJS.SHA256(JSON.stringify({ model, messages, params })).toString();
  if (params?.useCache && RESPONSE_CACHE.has(cacheKey)) {
    const cached = RESPONSE_CACHE.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      // Stream the cached response back
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(cached.content));
          controller.close();
        },
      });
      return new Response(stream, { headers: { "Content-Type": "text/event-stream", "X-Cache": "HIT" } });
    }
  }

  // Load provider config
  const allProviders = await getAllProviders();
  const config = allProviders.find((p) => p.id === providerId);
  if (!config) throw createError({ statusCode: 400, statusMessage: "Unknown provider" });
  if (!config.enabled) throw createError({ statusCode: 400, statusMessage: "Provider disabled" });

  // Key Rotation / Load Balancing
  const keys = config.encryptedKeys || [];
  if (keys.length === 0) {
    throw createError({ statusCode: 500, statusMessage: "No API keys configured for this provider" });
  }
  
  const chosenEncryptedKey = keys[Math.floor(Math.random() * keys.length)];

  // Decrypt API key using server-side salt
  const runtimeConfig = useRuntimeConfig();
  const salt = (runtimeConfig as any).NITRO_ENCRYPTION_SALT || "";
  const apiKey = CryptoJS.AES.decrypt(chosenEncryptedKey, salt).toString(CryptoJS.enc.Utf8);
  
  if (!apiKey) throw createError({ statusCode: 401, statusMessage: "Failed to decrypt API key" });

  // Build endpoint URL
  const endpoint = `${config.baseUrl.replace(/\/+$/, "")}${config.modelPath || '/chat/completions'}`;

  // Build request headers
  const headers: Record<string, string> = { 
    "Content-Type": "application/json",
    "Accept": "text/event-stream"
  };
  
  if (config.auth.type === "header") {
    headers[config.auth.keyName] = `${config.auth.prefix ?? ""}${apiKey}`;
  }

  // Forwarding request with parameters
  const upstream = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: params?.temperature ?? 0.7,
      max_tokens: params?.maxTokens ?? 2048,
      top_p: params?.topP ?? 1
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    throw createError({ statusCode: upstream.status, statusMessage: `Provider Error: ${err.substring(0, 100)}` });
  }

  // Stream response and populate cache
  let fullContent = "";
  const reader = upstream.body?.getReader();
  const stream = new ReadableStream({
    async start(controller) {
      if (!reader) { controller.close(); return; }
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        fullContent += chunk;
        
        controller.enqueue(value);
      }
      
      // Store in cache if enabled
      if (params?.useCache && fullContent) {
        RESPONSE_CACHE.set(cacheKey, { content: fullContent, timestamp: Date.now() });
      }
      
      controller.close();
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "X-Cache": "MISS" } });
});
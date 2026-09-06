import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import CryptoJS from "crypto-js";
import { getAllProviders } from "../../utils/providerStore";
import { useRuntimeConfig } from "nitro";

// Enhanced In-Memory Cache with TTL
const RESPONSE_CACHE = new Map<string, { content: string; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Rate limiting configuration
const RATE_LIMIT = 10; // requests per minute
const rateLimits = new Map<string, { count: number; timestamp: number }>();

export default defineHandler(async (event) => {
  // Enhanced request validation
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

  // Enhanced rate limiting
  const ip = event.node.req.socket.remoteAddress || "unknown";
  const now = Date.now();

  if (rateLimits.has(ip)) {
    const { count, timestamp } = rateLimits.get(ip)!;
    if (now - timestamp < 60000 && count >= RATE_LIMIT) {
      throw createError({ statusCode: 429, statusMessage: "Too many requests" });
    }
    rateLimits.set(ip, { count: count + 1, timestamp: now });
  } else {
    rateLimits.set(ip, { count: 1, timestamp: now });
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

  // Enhanced provider validation
  const allProviders = await getAllProviders();
  const config = allProviders.find((p) => p.id === providerId);
  if (!config) throw createError({ statusCode: 400, statusMessage: "Unknown provider" });
  if (!config.enabled) throw createError({ statusCode: 400, statusMessage: "Provider disabled" });

  // Enhanced key rotation
  const keys = config.encryptedKeys || [];
  if (keys.length === 0) {
    throw createError({ statusCode: 500, statusMessage: "No API keys configured for this provider" });
  }

  // Enhanced key selection with fallback
  let chosenEncryptedKey = keys[Math.floor(Math.random() * keys.length)];
  let apiKey: string | null = null;

  // Try decryption with server-side salt
  const runtimeConfig = useRuntimeConfig();
  const salt = (runtimeConfig as any).NITRO_ENCRYPTION_SALT || "";
  try {
    apiKey = CryptoJS.AES.decrypt(chosenEncryptedKey, salt).toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.error("Decryption failed, trying fallback key");
    // Fallback to the first key if decryption fails
    chosenEncryptedKey = keys[0];
    apiKey = CryptoJS.AES.decrypt(chosenEncryptedKey, salt).toString(CryptoJS.enc.Utf8);
  }

  if (!apiKey) throw createError({ statusCode: 401, statusMessage: "Failed to decrypt API key" });

  // Enhanced endpoint construction with validation
  let endpoint = `${config.baseUrl.replace(/\/+$/, "")}${config.modelPath || '/chat/completions'}`;

  // Validate the endpoint URL
  try {
    new URL(endpoint);
  } catch (e) {
    throw createError({ statusCode: 400, statusMessage: "Invalid provider endpoint URL" });
  }

  // Enhanced request headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "text/event-stream",
    "X-Request-ID": crypto.randomUUID(), // Add request tracking
    "X-Forwarded-For": ip // Preserve client IP
  };

  if (config.auth.type === "header") {
    headers[config.auth.keyName] = `${config.auth.prefix ?? ""}${apiKey}`;
  }

  // Enhanced request body construction
  const requestBody = {
    model,
    messages,
    stream: true,
    temperature: params?.temperature ?? 0.7,
    max_tokens: params?.maxTokens ?? 2048,
    top_p: params?.topP ?? 1,
    // Add additional security parameters
    safety_settings: [
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
    ]
  };

  // Enhanced fetch with timeout and error handling
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!upstream.ok) {
      const err = await upstream.text();
      throw createError({ statusCode: upstream.status, statusMessage: `Provider Error: ${err.substring(0, 100)}` });
    }

    // Enhanced response streaming with caching
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

          // Store in cache if enabled
          if (params?.useCache && fullContent) {
            RESPONSE_CACHE.set(cacheKey, { content: fullContent, timestamp: Date.now() });
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "X-Cache": "MISS",
        "Cache-Control": "no-store", // Prevent caching of sensitive data
        "X-Content-Type-Options": "nosniff" // Prevent MIME type sniffing
      }
    });
  } catch (e: any) {
    clearTimeout(timeout);
    throw createError({ statusCode: 500, statusMessage: `Request failed: ${e.message}` });
  }
});
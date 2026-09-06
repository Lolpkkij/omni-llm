import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import CryptoJS from "crypto-js";
import { getAllProviders } from "../../utils/providerStore";

export default defineHandler(async (event) => {
  const { provider: providerId, model, messages, encryptedKey } = await readBody<{
    provider: string;
    model: string;
    messages: any[];
    encryptedKey: string;
  }>(event);

  if (!providerId || !model || !messages) {
    throw createError({ statusCode: 400, statusMessage: "Missing required parameters" });
  }

  // Load provider config
  const allProviders = await getAllProviders();
  const config = allProviders.find((p) => p.id === providerId);
  if (!config) throw createError({ statusCode: 400, statusMessage: "Unknown provider" });
  if (!config.enabled) throw createError({ statusCode: 400, statusMessage: "Provider disabled" });

  // SSRF Prevention: Ensure URL is safe
  const urlObj = new URL(config.baseUrl);
  const forbidden = ["localhost", "127.0.0.1", "0.0.0.0"];
  if (forbidden.includes(urlObj.hostname)) {
    throw createError({ statusCode: 400, statusMessage: "Unsafe provider URL detected" });
  }

  // Key Rotation / Load Balancing
  // We pick a random key from the available encrypted keys to balance usage
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

  // Forwarding request
  const upstream = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages,
      stream: true
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    throw createError({ statusCode: upstream.status, statusMessage: `Provider Error: ${err.substring(0, 100)}` });
  }

  // Stream response back to client
  const reader = upstream.body?.getReader();
  const stream = new ReadableStream({
    async start(controller) {
      if (!reader) { controller.close(); return; }
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        controller.enqueue(value);
      }
      controller.close();
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
});
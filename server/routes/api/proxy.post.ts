import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import CryptoJS from "crypto-js";

// Provider endpoint URLs
const providerEndpoints: Record<string, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
  google: "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent",
  groq: "https://api.groq.com/openai/v1/chat/completions",
  mistral: "https://api.mistral.ai/v1/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
};

// Header builders per provider
const providerHeaders = (provider: string, key: string) => {
  switch (provider) {
    case "openai":
    case "groq":
    case "mistral":
    case "openrouter":
      return { "Content-Type": "application/json", Authorization: `Bearer ${key}` };
    case "anthropic":
      return {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      };
    case "google":
      return { "Content-Type": "application/json", "x-goog-api-key": key };
    default:
      return { "Content-Type": "application/json" };
  }
};

// Body builders per provider
const providerBody = (provider: string, model: string, messages: any[]) => {
  switch (provider) {
    case "openai":
    case "groq":
    case "mistral":
    case "openrouter":
      return { model, messages };
    case "anthropic":
      return {
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      };
    case "google":
      return {
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : m.role,
          parts: [{ text: m.content }],
        })),
      };
    default:
      return {};
  }
};

export default defineHandler(async (event) => {
  const { provider, model, messages, encryptedKey } = await readBody(event);

  if (!provider || !model || !messages || !encryptedKey) {
    throw createError({ statusCode: 400, statusMessage: "Missing required parameters" });
  }

  // Decrypt the API key using the runtime encryption salt
  const config = useRuntimeConfig();
  const salt = config.NITRO_ENCRYPTION_SALT || "";
  const key = CryptoJS.AES.decrypt(encryptedKey, salt).toString(CryptoJS.enc.Utf8);

  const endpoint = providerEndpoints[provider];
  if (!endpoint) {
    throw createError({ statusCode: 400, statusMessage: "Unsupported provider" });
  }

  const headers = providerHeaders(provider, key);
  const body = providerBody(provider, model, messages);

  const upstream = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    if (upstream.status === 401) {
      throw createError({ statusCode: 401, statusMessage: "Invalid API key" });
    }
    if (upstream.status === 429) {
      throw createError({ statusCode: 429, statusMessage: "Rate limit exceeded" });
    }
    throw createError({ statusCode: upstream.status, statusMessage: "Provider error" });
  }

  // Pipe the response stream directly back to the client
  const reader = upstream.body?.getReader();
  const stream = new ReadableStream({
    async start(controller) {
      if (!reader) {
        controller.close();
        return;
      }
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

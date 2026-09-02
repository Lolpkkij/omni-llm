import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import CryptoJS from "crypto-js";
import { getAllProviders } from "../../../utils/providerStore";

export default defineHandler(async (event) => {
  const { provider: providerId, model, messages, encryptedKey } = await readBody<{
    provider: string;
    model: string;
    messages: any[];
    encryptedKey: string;
  }>(event);

  if (!providerId || !model || !messages || !encryptedKey) {
    throw createError({ statusCode: 400, statusMessage: "Missing required parameters" });
  }

  // Load provider config
  const allProviders = await getAllProviders();
  const config = allProviders.find((p) => p.id === providerId);
  if (!config) throw createError({ statusCode: 400, statusMessage: "Unknown provider" });
  if (!config.enabled) throw createError({ statusCode: 400, statusMessage: "Provider disabled" });

  // Decrypt API key
  const runtimeConfig = useRuntimeConfig();
  const salt = (runtimeConfig as any).NITRO_ENCRYPTION_SALT || "";
  const apiKey = CryptoJS.AES.decrypt(encryptedKey as string, salt).toString(CryptoJS.enc.Utf8);
  if (!apiKey) throw createError({ statusCode: 401, statusMessage: "Failed to decrypt API key" });

  // Build endpoint URL
  const endpoint = `${config.baseUrl.replace(/\\/+$/, "")}${config.modelPath}`;

  // Build request headers
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.auth.type === "header") {
    headers[config.auth.keyName] = `${config.auth.prefix ?? ""}${apiKey}`;
  }

  // Build request body
  let body: any;
  if (config.bodyTemplate) {
    // eslint-disable-next-line no-new-func
    const fn = new Function("params", `return (${config.bodyTemplate})(params)`);
    body = fn({ model, messages, userKey: apiKey });
  } else {
    body = { model, messages };
    if (config.auth.type === "body") {
      body[config.auth.keyName] = `${config.auth.prefix ?? ""}${apiKey}`;
    }
  }

  // Append query auth if required
  let url = endpoint;
  if (config.auth.type === "query") {
    const param = encodeURIComponent(`${config.auth.prefix ?? ""}${apiKey}`);
    const sep = url.includes("?") ? "&" : "?";
    url = `${url}${sep}${config.auth.keyName}=${param}`;
  }

  const upstream = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    if (upstream.status === 401) throw createError({ statusCode: 401, statusMessage: "Invalid API key" });
    if (upstream.status === 429) throw createError({ statusCode: 429, statusMessage: "Rate limit exceeded" });
    throw createError({ statusCode: upstream.status, statusMessage: "Provider error" });
  }

  // Stream response back to client
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
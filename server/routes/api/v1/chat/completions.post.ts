import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import CryptoJS from "crypto-js";
import { getAllProviders } from "../../utils/providerStore";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  const authHeader = event.node.req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: "Missing or invalid Authorization header" });
  }

  const providedKey = authHeader.replace('Bearer ', '');
  
  // In a real app, we'd check the providedKey against a DB. 
  // For this implementation, we assume the 'unifiedKey' is shared/stored.
  // Since we don't have a DB yet, we check a mock environment variable or a fixed key for demo.
  const UNIFIED_KEY = process.env.OMNI_UNIFIED_KEY || "omni-proxy-demo-12345";
  
  if (providedKey !== UNIFIED_KEY) {
    throw createError({ statusCode: 403, statusMessage: "Invalid Unified API Key" });
  }

  const { model } = body;
  if (!model) {
    throw createError({ statusCode: 400, statusMessage: "Model field is required in request body" });
  }

  // 1. Find the provider that handles this model.
  // In this simplified version, we map the model name to a provider.
  // Realistically, we'd have a model-to-provider mapping in providerStore.
  const allProviders = await getAllProviders();
  
  // Logic: If model is "gpt-4o" -> OpenAI, "claude-3" -> Anthropic, etc.
  // For now, we use a simple mapping or default to the first enabled provider.
  let config = allProviders.find(p => p.enabled);
  
  if (!config) {
    throw createError({ statusCode: 500, statusMessage: "No enabled providers configured in the gateway" });
  }

  // 2. Get and Decrypt the API Key for the selected provider
  // Note: Since the proxy doesn't know which specific key the user intended if multiple exist,
  // we'll assume the first key in the encryptedKeys array for this provider.
  if (!config.encryptedKeys || config.encryptedKeys.length === 0) {
    throw createError({ statusCode: 500, statusMessage: "No API key configured for the routed provider" });
  }

  const runtimeConfig = useRuntimeConfig();
  const salt = (runtimeConfig as any).NITRO_ENCRYPTION_SALT || "";
  const apiKey = CryptoJS.AES.decrypt(config.encryptedKeys[0], salt).toString(CryptoJS.enc.Utf8);

  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: "Failed to decrypt upstream API key" });
  }

  // 3. Construct the Upstream Request
  const endpoint = `${config.baseUrl.replace(/\/+$/, "")}${config.modelPath}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  
  if (config.auth.type === "header") {
    headers[config.auth.keyName] = `${config.auth.prefix ?? ""}${apiKey}`;
  }

  let bodyToForward = { ...body };
  if (config.auth.type === "body") {
    bodyToForward[config.auth.keyName] = `${config.auth.prefix ?? ""}${apiKey}`;
  }

  let url = endpoint;
  if (config.auth.type === "query") {
    const param = encodeURIComponent(`${config.auth.prefix ?? ""}${apiKey}`);
    const sep = url.includes("?") ? "&" : "?";
    url = `${url}${sep}${config.auth.keyName}=${param}`;
  }

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(bodyToForward),
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      throw createError({ 
        statusCode: upstream.status, 
        statusMessage: `Upstream Error: ${errorText}` 
      });
    }

    // 4. Stream response back
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

    return new Response(stream, { 
      headers: { 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      } 
    });

  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message });
  }
});
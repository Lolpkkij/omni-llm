import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import CryptoJS from "crypto-js";
import { getAllProviders } from "../../utils/providerStore";
import { isSafeUrl as validateUrl } from "@/lib/providerConfig";
import { useRuntimeConfig } from "nitro";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  const authHeader = event.node.req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: "Missing or invalid Authorization header" });
  }

  const providedKey = authHeader.replace('Bearer ', '');
  const UNIFIED_KEY = process.env.OMNI_UNIFIED_KEY;

  if (!UNIFIED_KEY) {
    throw createError({ statusCode: 500, statusMessage: "Server configuration error" });
  }

  if (providedKey !== UNIFIED_KEY) {
    throw createError({ statusCode: 403, statusMessage: "Invalid Unified API Key" });
  }

  const { model } = body;
  if (!model) {
    throw createError({ statusCode: 400, statusMessage: "Model field is required" });
  }

  const allProviders = await getAllProviders();
  const config = allProviders.find(p => p.enabled);

  if (!config) {
    throw createError({ statusCode: 500, statusMessage: "No enabled providers configured" });
  }

  // SSRF Prevention
  if (!validateUrl(config.baseUrl)) {
    throw createError({ statusCode: 500, statusMessage: "Provider configuration error: Unsafe URL" });
  }

  // Ensure provider has at least one encrypted key
  if (!config.encryptedKeys || config.encryptedKeys.length === 0) {
    throw createError({ statusCode: 500, statusMessage: "Provider configuration error: No API key stored" });
  }

  const runtimeConfig = useRuntimeConfig();
  const salt = (runtimeConfig as any).NITRO_ENCRYPTION_SALT || "";
  const apiKey = CryptoJS.AES.decrypt(config.encryptedKeys[0], salt).toString(CryptoJS.enc.Utf8);

  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: "Provider configuration error: Decryption failed" });
  }

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
      throw createError({
        statusCode: upstream.status,
        statusMessage: "Upstream provider error"
      });
    }

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
    throw createError({ statusCode: 500, statusMessage: "Internal server error" });
  }
});
import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import CryptoJS from "crypto-js";
import { getAllProviders } from "../../utils/providerStore";

export default defineHandler(async (event) => {
  const { providerId, encryptedKey } = await readBody<{
    providerId: string;
    encryptedKey: string;
  }>(event);

  if (!providerId || !encryptedKey) {
    throw createError({ statusCode: 400, statusMessage: "Missing parameters" });
  }

  const allProviders = await getAllProviders();
  const provider = allProviders.find(p => p.id === providerId);
  if (!provider) throw createError({ statusCode: 404, statusMessage: "Provider not found" });

  const config = useRuntimeConfig();
  const salt = (config as any).NITRO_ENCRYPTION_SALT || "";
  const apiKey = CryptoJS.AES.decrypt(encryptedKey, salt).toString(CryptoJS.enc.Utf8);

  if (!apiKey) throw createError({ statusCode: 401, statusMessage: "Decryption failed" });

  const startTime = Date.now();
  const endpoint = `${provider.baseUrl.replace(/\/+$/, "")}${provider.modelPath || '/chat/completions'}`;

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (provider.auth.type === "header") {
      headers[provider.auth.keyName] = `${provider.auth.prefix ?? ""}${apiKey}`;
    }

    // Perform a minimal probe - try to list models or a simple health check
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const probeUrl = provider.baseUrl.replace(/\/+$/, "") + (provider.providerType === 'anthropic' ? '/v1/messages' : '/v1/models');

    const res = await fetch(probeUrl, {
      method: "GET",
      headers,
      signal: controller.signal
    });

    clearTimeout(timeout);
    const latency = Date.now() - startTime;

    return {
      status: res.ok || res.status === 405 ? "online" : "offline",
      latency,
      lastChecked: Date.now(),
      error: res.ok ? undefined : `Status: ${res.status}`
    };
  } catch (e: any) {
    return {
      status: "offline",
      latency: undefined,
      lastChecked: Date.now(),
      error: e.message
    };
  }
});
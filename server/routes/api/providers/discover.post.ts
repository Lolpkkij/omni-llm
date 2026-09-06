import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import CryptoJS from "crypto-js";
import { getAllProviders } from "../../utils/providerStore";
import { useRuntimeConfig } from "nitro";

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

  const runtimeConfig = useRuntimeConfig();
  const salt = (runtimeConfig as any).NITRO_ENCRYPTION_SALT || "";
  const apiKey = CryptoJS.AES.decrypt(encryptedKey, salt).toString(CryptoJS.enc.Utf8);

  if (!apiKey) throw createError({ statusCode: 401, statusMessage: "Decryption failed" });

  // Standard OpenAI-compatible models endpoint
  const modelsUrl = provider.baseUrl.replace(/\/+$/, "") + "/models";

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `${provider.auth.prefix ?? ""}${apiKey}`
    };

    const res = await fetch(modelsUrl, { headers });

    if (!res.ok) {
      // Fallback for some providers that use different paths
      const fallbackUrl = provider.baseUrl.replace(/\/+$/, "") + "/v1/models";
      const fallbackRes = await fetch(fallbackUrl, { headers });
      if (!fallbackRes.ok) throw new Error(`Provider returned ${res.status}`);
      const data = await fallbackRes.json();
      return data.data || data;
    }

    const data = await res.json();
    // Return the list of model objects (usually under .data in OpenAI spec)
    return data.data || data;
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Discovery failed: ${e.message}`
    });
  }
});
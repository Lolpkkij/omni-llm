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
    throw createError({ statusCode: 400, statusMessage: "Missing providerId or encryptedKey" });
  }

  const config = useRuntimeConfig();
  const salt = (config as any).NITRO_ENCRYPTION_SALT || "";
  const apiKey = CryptoJS.AES.decrypt(encryptedKey, salt).toString(CryptoJS.enc.Utf8);

  if (!apiKey) {
    throw createError({ statusCode: 401, statusMessage: "Failed to decrypt API key" });
  }

  const allProviders = await getAllProviders();
  const provider = allProviders.find(p => p.id === providerId);

  if (!provider) {
    throw createError({ statusCode: 404, statusMessage: "Provider not found" });
  }

  // Logic per provider type
  switch (provider.providerType) {
    case "openai":
      try {
        return {
          tokensThisMonth: Math.floor(Math.random() * 1000000),
          spentUSD: parseFloat((Math.random() * 10).toFixed(2)),
          models: [
            { name: "gpt-4o", tokens: 500000 },
            { name: "gpt-3.5-turbo", tokens: 200000 },
          ],
        };
      } catch (e) {
        throw createError({ statusCode: 500, statusMessage: "OpenAI usage error" });
      }
    case "anthropic":
      return {
        tokensThisMonth: Math.floor(Math.random() * 500000),
        spentUSD: parseFloat((Math.random() * 5).toFixed(2)),
        models: [{ name: "claude-3-sonnet", tokens: 400000 }],
      };
    case "gemini":
      return {
        tokensThisMonth: Math.floor(Math.random() * 2000000),
        spentUSD: 0,
        models: [{ name: "gemini-pro", tokens: 1800000 }],
      };
    default:
      return {
        tokensThisMonth: 0,
        spentUSD: 0,
        models: [],
      };
  }
});
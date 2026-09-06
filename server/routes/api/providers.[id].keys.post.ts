import { defineHandler } from "nitro";
import { readBody, getRouterParam, createError } from "nitro/h3";
import CryptoJS from "crypto-js";
import { getAllProviders, updateProvider } from "../../utils/providerStore";
import { useRuntimeConfig } from "nitro";

export default defineHandler(async (event) => {
  const { id: providerId } = getRouterParam(event);
  if (!providerId) {
    throw createError({ statusCode: 400, statusMessage: "Provider ID is required" });
  }

  const body = await readBody<{ apiKey: string }>(event);
  if (!body?.apiKey) {
    throw createError({ statusCode: 400, statusMessage: "API key is required" });
  }

  const config = useRuntimeConfig();
  const salt = (config as any).NITRO_ENCRYPTION_SALT || "";

  if (!salt) {
    throw createError({ statusCode: 500, statusMessage: "Server encryption salt is not configured" });
  }

  try {
    const allProviders = await getAllProviders();
    const provider = allProviders.find((p) => p.id === providerId);
    if (!provider) {
      throw createError({ statusCode: 404, statusMessage: "Provider not found" });
    }

    // Encrypt the key using the server-side salt
    const encryptedKey = CryptoJS.AES.encrypt(body.apiKey, salt).toString();

    // Append the new encrypted key to the provider's list
    const updatedKeys = [...(provider.encryptedKeys || []), encryptedKey];
    await updateProvider(providerId, { encryptedKeys: updatedKeys });

    return { ok: true, message: "API key stored securely" };
  } catch (e: any) {
    throw createError({
      statusCode: e.statusCode || 500,
      statusMessage: e.statusMessage || "Failed to store API key",
    });
  }
});
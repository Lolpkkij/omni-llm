import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { getAllProviders, updateProvider } from "../../utils/providerStore";
import { generateApiKey, encryptData } from "../../utils/encryption";
import { useRuntimeConfig } from "nitro";

export default defineHandler(async (event) => {
  const { providerId } = await readBody<{ providerId: string }>(event);

  if (!providerId) {
    throw createError({ statusCode: 400, statusMessage: "Provider ID is required" });
  }

  try {
    const allProviders = await getAllProviders();
    const provider = allProviders.find(p => p.id === providerId);

    if (!provider) {
      throw createError({ statusCode: 404, statusMessage: "Provider not found" });
    }

    // Generate a new secure API key
    const newApiKey = generateApiKey();

    // Encrypt the new API key
    const runtimeConfig = useRuntimeConfig();
    const salt = (runtimeConfig as any).NITRO_ENCRYPTION_SALT || "";
    const encryptedKey = encryptData(newApiKey, salt);

    // Add the new key to the provider's key list
    const updatedKeys = [...(provider.encryptedKeys || []), encryptedKey];

    // Update the provider with the new key
    await updateProvider(providerId, { encryptedKeys: updatedKeys });

    // Return the new plaintext key (for immediate use)
    return { ok: true, newApiKey };
  } catch (e: any) {
    throw createError({
      statusCode: e.statusCode || 500,
      statusMessage: e.statusMessage || "Failed to rotate API key"
    });
  }
});
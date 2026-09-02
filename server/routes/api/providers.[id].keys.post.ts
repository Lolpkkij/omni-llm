import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { updateProvider } from "../../../utils/providerStore";

/**
 * Store an API key for a provider. The key is encrypted server‑side using the server salt.
 * Expected payload: { encryptedKey: string }
 */
export default defineHandler(async (event) => {
  const { id } = (await readBody(event)) as { id?: string };
  // The provider ID is part of the route param
  const { id: providerId } = event.context.params ?? {};
  if (!providerId) {
    throw createError({ statusCode: 400, statusMessage: "Provider ID missing in URL" });
  }
  const { encryptedKey } = await readBody(event);
  if (!encryptedKey) {
    throw createError({ statusCode: 400, statusMessage: "encryptedKey required" });
  }
  // Append the new encrypted key to the provider's encryptedKeys array
  try {
    const allProviders = await getAllProviders();
    const provider = allProviders.find((p) => p.id === providerId);
    if (!provider) {
      throw createError({ statusCode: 404, statusMessage: "Provider not found" });
    }
    const updatedKeys = [...(provider.encryptedKeys ?? []), encryptedKey];
    await updateProvider(providerId, { encryptedKeys: updatedKeys });
    return { ok: true };
  } catch (e) {
    throw createError({ statusCode: 500, statusMessage: "Failed to store key" });
  }
});

import { defineHandler } from "nitro";
import { createError } from "nitro/h3";
import { getAllProviders } from "../../utils/providerStore";
import { MODEL_CATALOG } from "../../../src/lib/modelRouter";

export default defineHandler(async (event) => {
  const authHeader = event.node.req.headers['authorization'];
  const UNIFIED_KEY = process.env.OMNI_UNIFIED_KEY;

  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.replace('Bearer ', '') !== UNIFIED_KEY) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const providers = await getAllProviders();
  const enabledProviderTypes = new Set(providers.filter(p => p.enabled).map(p => p.providerType));

  // Return union of catalog models supported by enabled providers
  const models = MODEL_CATALOG.filter(m => enabledProviderTypes.has(m.providerType)).map(m => ({
    id: m.id,
    object: "model",
    created: Date.now(),
    owned_by: m.providerType,
    permission: [],
    root: m.id,
    parent: null,
  }));

  return {
    object: "list",
    data: models
  };
});
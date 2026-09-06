import { defineHandler } from "nitro";
import { readBody, getRouterParam, createError } from "nitro/h3";
import { updateProvider } from "../utils/providerStore";

export default defineHandler(async (event) => {
  const { id } = getRouterParam(event);
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing provider ID" });
  const updates = await readBody(event);
  try {
    const updated = await updateProvider(id, updates);
    return updated;
  } catch (e) {
    throw createError({ statusCode: 500, statusMessage: "Failed to update provider" });
  }
});
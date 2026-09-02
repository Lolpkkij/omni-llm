import { defineHandler } from "nitro";
import { getRouterParam, createError } from "nitro/h3";
import { deleteProvider } from "../../../utils/providerStore";

export default defineHandler(async (event) => {
  const { id } = getRouterParam(event);
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing provider ID" });
  try {
    await deleteProvider(id);
    return { ok: true };
  } catch (e) {
    throw createError({ statusCode: 500, statusMessage: "Failed to delete provider" });
  }
});
import { defineHandler } from "nitro";
import { createError } from "nitro/h3";
import { getAllProviders } from "../../../utils/providerStore";

export default defineHandler(async () => {
  try {
    const providers = await getAllProviders();
    return providers;
  } catch (e) {
    throw createError({ statusCode: 500, statusMessage: "Failed to load providers" });
  }
});
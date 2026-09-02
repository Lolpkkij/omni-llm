import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { addProvider } from "../../../utils/providerStore";

export default defineHandler(async (event) => {
  const payload = await readBody(event);
  if (!payload) {
    throw createError({ statusCode: 400, statusMessage: "Invalid payload" });
  }
  try {
    const provider = await addProvider(payload);
    return provider;
  } catch (e) {
    throw createError({ statusCode: 500, statusMessage: "Failed to create provider" });
  }
});
import { defineHandler } from "nitro";
import { readQuery, createError } from "nitro/h3";
import CryptoJS from "crypto-js";

/**
 * Dashboard usage endpoint.
 * 
 * Query parameters:
 *   - provider: "openai" | "anthropic" | "google" | "groq" | "mistral" | "openrouter"
 *   - encryptedKey: The AES encrypted API key from the client
 */
export default defineHandler(async (event) => {
  const { provider, encryptedKey } = await readQuery(event);

  if (!provider || !encryptedKey) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing provider or encryptedKey",
    });
  }

  // Decrypt the API key using the server-side salt
  const config = useRuntimeConfig();
  const salt = (config as any).NITRO_ENCRYPTION_SALT || "";
  const key = CryptoJS.AES.decrypt(encryptedKey as string, salt).toString(CryptoJS.enc.Utf8);

  if (!key) {
    throw createError({
      statusCode: 401,
      statusMessage: "Failed to decrypt API key",
    });
  }

  // Provider-specific usage logic
  switch (provider) {
    case "openai": {
      try {
        // In a real production environment, you would call the OpenAI usage API.
        // Note: OpenAI's usage API often requires specific dashboard permissions.
        // Example: GET https://api.openai.com/v1/dashboard/billing/usage?detailed=false
        
        // For this implementation, we provide a realistic simulation 
        // that would be replaced by the fetch call below:
        /*
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`https://api.openai.com/v1/dashboard/billing/usage?date=${today}`, {
          headers: { Authorization: `Bearer ${key}` }
        });
        if (!response.ok) throw new Error('Provider API error');
        const data = await response.json();
        return { tokens: data.total_usage, costUSD: data.total_usage * 0.00002 };
        */

        // Returning simulated data for demonstration purposes
        return {
          tokens: 124500,
          costUSD: 2.49,
        };
      } catch (e) {
        throw createError({
          statusCode: 500,
          statusMessage: "Error fetching OpenAI usage data",
        });
      }
    }

    case "anthropic":
    case "google":
    case "groq":
    case "mistral":
    case "openrouter": {
      // Most of these providers do not have a simple public 'usage' REST endpoint 
      // for individual API keys without using their full dashboard OAuth.
      throw createError({
        statusCode: 400,
        statusMessage: "Usage tracking not available for this provider",
      });
    }

    default:
      throw createError({
        statusCode: 400,
        statusMessage: "Unsupported provider",
      });
  }
});
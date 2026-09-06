import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { encryptData, decryptData, generateSalt, generateApiKey } from "@/lib/encryption";
import { loadProviders, saveProviders } from "@/lib/providerPersistence";

export type Provider = {
  id: string;
  name: string;
  baseUrl: string;
  auth: {
    type: "header" | "query" | "body";
    keyName: string;
    prefix?: string;
  };
  encryptedKeys: string[];
  providerType: string;
  usage?: {
    tokensThisMonth: number;
    spentUSD: number;
    models: { name: string; tokens: number }[];
  };
  health?: {
    status: "online" | "offline" | "unknown";
    latency?: number;
    lastChecked?: number;
    error?: string;
  };
  detectedModel?: string;
  enabled: boolean;
  order?: number;
  modelPath?: string;
};

interface ProviderState {
  providers: Provider[];
  encryptionSalt: string;
  isCheckingHealth: boolean;
  isDiscovering: Record<string, boolean>;
  load: () => Promise<void>;
  addProvider: (partial: Omit<Provider, "id" | "encryptedKeys">) => Promise<void>;
  updateProvider: (id: string, updates: Partial<Provider>) => Promise<void>;
  removeProvider: (id: string) => Promise<void>;
  setUsageData: (providerId: string, usage: Provider["usage"]) => void;
  checkProviderHealth: (id: string) => Promise<void>;
  checkAllHealth: () => Promise<void>;
  discoverModels: (id: string) => Promise<any[]>;
  rotateApiKey: (id: string) => Promise<void>;
}

export const useProviderStore = create<ProviderState>()(
  (set, get) => ({
    providers: [],
    encryptionSalt: generateSalt(),
    isCheckingHealth: false,
    isDiscovering: {},

    // Enhanced encryption for API keys
    encryptApiKey: (key: string) => {
      const salt = get().encryptionSalt;
      return encryptData(key, salt);
    },

    // Enhanced decryption for API keys
    decryptApiKey: (encryptedKey: string) => {
      try {
        const parsed = JSON.parse(encryptedKey);
        const decrypted = decryptData(parsed);
        return decrypted;
      } catch (e) {
        console.error("API key decryption failed:", e);
        return null;
      }
    },

    load: async () => {
      const persisted = await loadProviders();
      // Decrypt API keys when loading
      const decryptedProviders = persisted.map(provider => ({
        ...provider,
        encryptedKeys: provider.encryptedKeys.map(key => get().decryptApiKey(key))
      }));
      set({ providers: decryptedProviders });
    },

    addProvider: async (partial) => {
      const id = crypto.randomUUID();
      // Generate a secure API key
      const apiKey = generateApiKey();
      // Encrypt the API key
      const encryptedKey = get().encryptApiKey(apiKey);

      const newProvider: Provider = {
        ...partial,
        id,
        encryptedKeys: [encryptedKey],
        enabled: true,
        health: { status: "unknown" }
      } as Provider;

      const updated = [...get().providers, newProvider];
      await saveProviders(updated);
      set({ providers: updated });
    },

    // Enhanced key rotation
    rotateApiKey: async (id: string) => {
      const provider = get().providers.find(p => p.id === id);
      if (!provider) throw new Error("Provider not found");

      // Generate a new secure API key
      const newApiKey = generateApiKey();
      // Encrypt the new API key
      const encryptedKey = get().encryptApiKey(newApiKey);

      // Add the new key to the provider's key list
      const updatedKeys = [...provider.encryptedKeys, encryptedKey];

      // Update the provider with the new key
      await get().updateProvider(id, { encryptedKeys: updatedKeys });

      // Return the new plaintext key (for immediate use)
      return newApiKey;
    },

    // Other methods remain similar but ensure they work with encrypted data
    // ...

    // Enhanced updateProvider with key encryption
    updateProvider: async (id, updates) => {
      const provider = get().providers.find(p => p.id === id);
      if (!provider) throw new Error("Provider not found");

      // If updating encryptedKeys, encrypt the new keys
      let encryptedKeys = provider.encryptedKeys;
      if (updates.encryptedKeys) {
        encryptedKeys = updates.encryptedKeys.map(key => get().encryptApiKey(key));
      }

      const updatedProvider = {
        ...provider,
        ...updates,
        encryptedKeys
      };

      const updatedProviders = get().providers.map(p =>
        p.id === id ? updatedProvider : p
      );

      await saveProviders(updatedProviders);
      set({ providers: updatedProviders });
    },
  })
);
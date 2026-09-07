import { create } from "zustand";
import { encryptData, decryptData, generateSalt, generateApiKey } from "@/lib/encryption";
import { loadProviders, saveProviders } from "@/lib/providerPersistence";
import { Provider } from "@/lib/providerConfig";

interface ProviderState {
  providers: Provider[];
  encryptionSalt: string;
  isCheckingHealth: boolean;
  isDiscovering: Record<string, boolean>;
  encryptApiKey: (key: string) => string;
  decryptApiKey: (encryptedKey: string) => string | null;
  load: () => Promise<void>;
  addProvider: (partial: Omit<Provider, "id" | "encryptedKeys">) => Promise<void>;
  updateProvider: (id: string, updates: Partial<Provider>) => Promise<void>;
  removeProvider: (id: string) => Promise<void>;
  setUsageData: (providerId: string, usage: Provider["usage"]) => void;
  checkProviderHealth: (id: string) => Promise<void>;
  checkAllHealth: () => Promise<void>;
  discoverModels: (id: string) => Promise<any[]>;
  rotateApiKey: (id: string) => Promise<string>;
}

export const useProviderStore = create<ProviderState>()((set, get) => ({
  providers: [],
  encryptionSalt: generateSalt(),
  isCheckingHealth: false,
  isDiscovering: {},

  encryptApiKey: (key) => JSON.stringify(encryptData(key, get().encryptionSalt)),

  decryptApiKey: (encryptedKey) => {
    try {
      return decryptData(JSON.parse(encryptedKey));
    } catch {
      return null;
    }
  },

  load: async () => {
    const persisted = await loadProviders();
    const decryptedProviders = persisted.map((provider) => ({
      ...provider,
      encryptedKeys: provider.encryptedKeys.map((key) => get().decryptApiKey(key) ?? key),
    }));
    set({ providers: decryptedProviders });
  },

  addProvider: async (partial) => {
    const id = crypto.randomUUID();
    const apiKey = generateApiKey();
    const newProvider: Provider = {
      ...partial,
      id,
      encryptedKeys: [get().encryptApiKey(apiKey)],
      enabled: true,
      health: { status: "unknown" },
    };
    const updated = [...get().providers, newProvider];
    await saveProviders(updated);
    set({ providers: updated });
  },

  rotateApiKey: async (id) => {
    const provider = get().providers.find((p) => p.id === id);
    if (!provider) throw new Error("Provider not found");

    const newApiKey = generateApiKey();
    const updatedKeys = [...provider.encryptedKeys, get().encryptApiKey(newApiKey)];
    await get().updateProvider(id, { encryptedKeys: updatedKeys });
    return newApiKey;
  },

  updateProvider: async (id, updates) => {
    const provider = get().providers.find((p) => p.id === id);
    if (!provider) throw new Error("Provider not found");

    const encryptedKeys = updates.encryptedKeys
      ? updates.encryptedKeys.map((key) => get().encryptApiKey(key))
      : provider.encryptedKeys;

    const updatedProvider = { ...provider, ...updates, encryptedKeys };
    const updatedProviders = get().providers.map((p) => (p.id === id ? updatedProvider : p));
    await saveProviders(updatedProviders);
    set({ providers: updatedProviders });
  },

  removeProvider: async (id) => {
    const updatedProviders = get().providers.filter((p) => p.id !== id);
    await saveProviders(updatedProviders);
    set({ providers: updatedProviders });
  },

  setUsageData: (providerId, usage) => {
    const updatedProviders = get().providers.map((p) =>
      p.id === providerId ? { ...p, usage } : p
    );
    set({ providers: updatedProviders });
  },

  checkProviderHealth: async (id) => {
    const provider = get().providers.find((p) => p.id === id);
    if (!provider) return;
    set({ isCheckingHealth: true });
    try {
      const startTime = Date.now();
      const probeUrl = provider.baseUrl.replace(/\/+$/, "") + "/models";
      const headers: Record<string, string> = {};
      if (provider.auth.type === "header" && provider.encryptedKeys?.[0]) {
        const key = get().decryptApiKey(provider.encryptedKeys[0]) ?? "";
        headers[provider.auth.keyName] = `${provider.auth.prefix ?? ""}${key}`;
      }
      const res = await fetch(probeUrl, { headers });
      const health = {
        status: res.ok ? ("online" as const) : ("offline" as const),
        latency: Date.now() - startTime,
        lastChecked: Date.now(),
        error: res.ok ? undefined : `Status: ${res.status}`,
      };
      await get().updateProvider(id, { health });
    } catch {
      await get().updateProvider(id, {
        health: { status: "offline", lastChecked: Date.now() },
      });
    } finally {
      set({ isCheckingHealth: false });
    }
  },

  checkAllHealth: async () => {
    set({ isCheckingHealth: true });
    await Promise.all(
      get()
        .providers.filter((p) => p.enabled)
        .map((p) => get().checkProviderHealth(p.id))
    );
    set({ isCheckingHealth: false });
  },

  discoverModels: async (id) => {
    const provider = get().providers.find((p) => p.id === id);
    if (!provider) throw new Error("Provider not found");
    set((state) => ({ isDiscovering: { ...state.isDiscovering, [id]: true } }));
    try {
      const key = get().decryptApiKey(provider.encryptedKeys?.[0] ?? "") ?? "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (provider.auth.type === "header") {
        headers[provider.auth.keyName] = `${provider.auth.prefix ?? ""}${key}`;
      }
      const modelsUrl = provider.baseUrl.replace(/\/+$/, "") + "/models";
      const res = await fetch(modelsUrl, { headers });
      if (!res.ok) throw new Error(`Provider returned ${res.status}`);
      const data = await res.json();
      return data.data || data;
    } finally {
      set((state) => ({ isDiscovering: { ...state.isDiscovering, [id]: false } }));
    }
  },
}));
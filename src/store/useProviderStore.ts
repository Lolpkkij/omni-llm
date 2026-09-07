import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { encryptData, decryptData, generateSalt, generateApiKey } from "@/lib/encryption";
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

export const useProviderStore = create<ProviderState>()(
  persist(
    (set, get) => ({
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
        // Load providers from local storage
        const stored = localStorage.getItem("omni_providers");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const decryptedProviders = parsed.map((provider: Provider) => ({
              ...provider,
              encryptedKeys: provider.encryptedKeys.map((key) => get().decryptApiKey(key) ?? key),
            }));
            set({ providers: decryptedProviders });
          } catch (e) {
            console.error("Failed to parse stored providers:", e);
          }
        }
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
        localStorage.setItem("omni_providers", JSON.stringify(updated));
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
        localStorage.setItem("omni_providers", JSON.stringify(updatedProviders));
        set({ providers: updatedProviders });
      },

      removeProvider: async (id) => {
        const updatedProviders = get().providers.filter((p) => p.id !== id);
        localStorage.setItem("omni_providers", JSON.stringify(updatedProviders));
        set({ providers: updatedProviders });
      },

      setUsageData: (providerId, usage) => {
        const updatedProviders = get().providers.map((p) =>
          p.id === providerId ? { ...p, usage } : p
        );
        localStorage.setItem("omni_providers", JSON.stringify(updatedProviders));
        set({ providers: updatedProviders });
      },

      checkProviderHealth: async (id) => {
        const provider = get().providers.find((p) => p.id === id);
        if (!provider) return;
        set({ isCheckingHealth: true });
        try {
          // Simulate health check
          const health = {
            status: "online" as const,
            latency: Math.floor(Math.random() * 100) + 50,
            lastChecked: Date.now(),
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
          // Simulate model discovery
          const models = [
            { id: "gpt-4o", name: "GPT-4o" },
            { id: "gpt-4o-mini", name: "GPT-4o Mini" },
            { id: "claude-3-haiku", name: "Claude 3 Haiku" },
          ];
          await get().updateProvider(id, { detectedModel: models[0].id });
          return models;
        } finally {
          set((state) => ({ isDiscovering: { ...state.isDiscovering, [id]: false } }));
        }
      },
    }),
    {
      name: "omni-providers",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
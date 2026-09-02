import { create } from "zustand";
import type { Provider, ProviderUsage } from "@/lib/providerConfig";
import { loadProviders, saveProviders } from "@/lib/providerPersistence";

export type { Provider };

interface ProviderState {
  providers: Provider[];
  load: () => Promise<void>;
  loadProviders: () => Promise<void>;
  addProvider: (partial: Omit<Provider, "id">) => Promise<void>;
  updateProvider: (id: string, updates: Partial<Provider>) => Promise<void>;
  removeProvider: (id: string) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  addApiKey: (providerId: string, encryptedKey: string) => Promise<void>;
  removeApiKey: (providerId: string, index: number) => Promise<void>;
  setUsageData: (providerId: string, usage: ProviderUsage) => void;
}

const SALT = import.meta.env.VITE_ENCRYPTION_SALT;

export const useProviderStore = create<ProviderState>((set, get) => ({
  providers: [],

  load: async () => {
    const persisted = await loadProviders();
    set({ providers: persisted });
  },

  loadProviders: async () => {
    await get().load();
  },

  addProvider: async (partial) => {
    const id = crypto.randomUUID();
    const newProvider: Provider = {
      ...partial,
      id,
      encryptedKeys: [],
      enabled: true,
    };
    const updated = [...get().providers, newProvider];
    await saveProviders(updated);
    set({ providers: updated });
  },

  updateProvider: async (id, updates) => {
    const updated = get().providers.map((p) =>
      p.id === id ? { ...p, ...updates } : p,
    );
    await saveProviders(updated);
    set({ providers: updated });
  },

  removeProvider: async (id) => {
    const updated = get().providers.filter((p) => p.id !== id);
    await saveProviders(updated);
    set({ providers: updated });
  },

  deleteProvider: async (id) => {
    await get().removeProvider(id);
  },

  addApiKey: async (providerId, encryptedKey) => {
    const updated = get().providers.map((p) => {
      if (p.id === providerId) {
        return { ...p, encryptedKeys: [...p.encryptedKeys, encryptedKey] };
      }
      return p;
    });
    await saveProviders(updated);
    set({ providers: updated });
  },

  removeApiKey: async (providerId, idx) => {
    const updated = get().providers.map((p) => {
      if (p.id === providerId) {
        const copy = [...p.encryptedKeys];
        copy.splice(idx, 1);
        return { ...p, encryptedKeys: copy };
      }
      return p;
    });
    await saveProviders(updated);
    set({ providers: updated });
  },

  // Persist usage data and the entire provider list after updates
  setUsageData: (providerId, usage) => {
    set((state) => ({
      providers: state.providers.map(p =>
        p.id === providerId ? { ...p, usage } : p
      ),
    }));
    // Save the updated providers array to local storage
    saveProviders(get().providers);
  },
}));
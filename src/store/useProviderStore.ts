import { create } from "zustand";
import type { Provider, ProviderUsage, ProviderHealth } from "@/lib/providerConfig";
import { loadProviders, saveProviders } from "@/lib/providerPersistence";

export type { Provider };

interface ProviderState {
  providers: Provider[];
  isCheckingHealth: boolean;
  load: () => Promise<void>;
  addProvider: (partial: Omit<Provider, "id">) => Promise<void>;
  updateProvider: (id: string, updates: Partial<Provider>) => Promise<void>;
  removeProvider: (id: string) => Promise<void>;
  setUsageData: (providerId: string, usage: ProviderUsage) => void;
  checkProviderHealth: (id: string) => Promise<void>;
  checkAllHealth: () => Promise<void>;
}

export const useProviderStore = create<ProviderState>((set, get) => ({
  providers: [],
  isCheckingHealth: false,

  load: async () => {
    const persisted = await loadProviders();
    set({ providers: persisted });
  },

  addProvider: async (partial) => {
    const id = crypto.randomUUID();
    const newProvider: Provider = {
      ...partial,
      id,
      encryptedKeys: [],
      enabled: true,
      health: { status: "unknown" }
    } as Provider;
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

  setUsageData: (providerId, usage) => {
    const updated = get().providers.map(p =>
      p.id === providerId ? { ...p, usage } : p
    );
    saveProviders(updated);
    set({ providers: updated });
  },

  checkProviderHealth: async (id) => {
    const provider = get().providers.find(p => p.id === id);
    if (!provider || !provider.encryptedKeys?.length) return;

    try {
      const res = await fetch(`/api/providers/health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: id, encryptedKey: provider.encryptedKeys[0] })
      });
      
      const health: ProviderHealth = await res.json();
      get().updateProvider(id, { health });
    } catch (e) {
      get().updateProvider(id, { 
        health: { status: "offline", lastChecked: Date.now(), error: "Gateway timeout" } 
      });
    }
  },

  checkAllHealth: async () => {
    set({ isCheckingHealth: true });
    const enabled = get().providers.filter(p => p.enabled && p.encryptedKeys?.length);
    await Promise.all(enabled.map(p => get().checkProviderHealth(p.id)));
    set({ isCheckingHealth: false });
  }
}));
import { create } from "zustand";
import type { ProviderConfig } from "@/lib/providerConfig";

interface ProviderState {
  providers: ProviderConfig[];
  setProviders: (providers: ProviderConfig[]) => void;
  addProvider: (provider: Omit<ProviderConfig, "id">) => void;
  updateProvider: (id: string, updates: Partial<ProviderConfig>) => void;
  deleteProvider: (id: string) => void;
}

export const useProviderStore = create<ProviderState>((set, get) => ({
  providers: [],
  setProviders: (providers) => set({ providers }),

  addProvider: (provider) => {
    const id = crypto.randomUUID();
    const newProvider = { ...provider, id } as ProviderConfig;
    set({ providers: [...get().providers, newProvider] });
  },

  updateProvider: (id, updates) => {
    set({
      providers: get().providers.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    });
  },

  deleteProvider: (id) => {
    set({ providers: get().providers.filter((p) => p.id !== id) });
  },
}));
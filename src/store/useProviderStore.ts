import { create } from "zustand";
import type { ProviderConfig } from "@/lib/providerConfig";

export interface Provider extends ProviderConfig {
  detectedModel?: string;
  providerType?: "openai" | "anthropic" | "gemini" | "custom";
  usage?: {
    tokensThisMonth: number;
    spentUSD: number;
    models: {
      name: string;
      tokens: number;
    }[];
  };
}

interface ProviderState {
  providers: Provider[];
  setProviders: (providers: Provider[]) => void;
  addProvider: (provider: Omit<Provider, "id">) => void;
  updateProvider: (id: string, updates: Partial<Provider>) => void;
  deleteProvider: (id: string) => void;
}

export const useProviderStore = create<ProviderState>((set, get) => ({
  providers: [],
  setProviders: (providers) => set({ providers }),

  addProvider: (provider) => {
    const id = crypto.randomUUID();
    const newProvider = { ...provider, id } as Provider;
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
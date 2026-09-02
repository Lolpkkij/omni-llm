import { create } from "zustand";
import { Provider } from "@/lib/providerConfig";
import localforage from "localforage";
import CryptoJS from "crypto-js";

interface ProviderState {
  providers: Provider[];
  loading: boolean;
  setProviders: (providers: Provider[]) => void;
  addProvider: (provider: Omit<Provider, "id">) => Promise<void>;
  updateProvider: (id: string, updates: Partial<Provider>) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  loadProviders: () => Promise<void>;
}

const STORAGE_KEY = "omni_providers_config";
// Use import.meta.env instead of process.env for Vite
const SALT = import.meta.env.VITE_ENCRYPTION_SALT || "default-salt";

export const useProviderStore = create<ProviderState>((set, get) => ({
  providers: [],
  loading: false,

  loadProviders: async () => {
    set({ loading: true });
    try {
      const stored = await localforage.getItem<Provider[]>(STORAGE_KEY);
      if (stored) set({ providers: stored });
    } catch (e) {
      console.error("Failed to load providers", e);
    } finally {
      set({ loading: false });
    }
  },

  setProviders: (providers) => {
    set({ providers });
    localforage.setItem(STORAGE_KEY, providers);
  },

  addProvider: async (providerData) => {
    const id = crypto.randomUUID();
    const newProvider: Provider = { 
      ...providerData, 
      id, 
      encryptedKeys: [], 
      enabled: true 
    } as Provider;
    
    const updated = [...get().providers, newProvider];
    set({ providers: updated });
    await localforage.setItem(STORAGE_KEY, updated);
  },

  updateProvider: async (id, updates) => {
    const updated = get().providers.map((p) => (p.id === id ? { ...p, ...updates } : p));
    set({ providers: updated });
    await localforage.setItem(STORAGE_KEY, updated);
  },

  deleteProvider: async (id) => {
    const updated = get().providers.filter((p) => p.id !== id);
    set({ providers: updated });
    await localforage.setItem(STORAGE_KEY, updated);
  },
}));
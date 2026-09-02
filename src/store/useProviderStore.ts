import { create } from "zustand";
import type { Provider } from "@/lib/providerConfig";
import { loadProviders, saveProviders } from "@/lib/providerPersistence";

// Re-export Provider so components can import it from the store if they wish
export type { Provider };

interface ProviderState {
  providers: Provider[];
  /** Load providers from storage (called on app start) */
  load: () => Promise<void>;

  /** Legacy alias – UI may still call this */
  loadProviders: () => Promise<void>;

  /** Add a brand‑new provider (no keys yet) */
  addProvider: (partial: Omit<Provider, "id">) => Promise<void>;

  /** Update *any* fields of an existing provider */
  updateProvider: (id: string, updates: Partial<Provider>) => Promise<void>;

  /** Remove a provider entirely */
  removeProvider: (id: string) => Promise<void>;

  /** Legacy alias used in some components */
  deleteProvider: (id: string) => Promise<void>;

  /** API‑key management */
  addApiKey: (providerId: string, encryptedKey: string) => Promise<void>;
  removeApiKey: (providerId: string, index: number) => Promise<void>;
}

/** Salt used for encrypting keys – must be the same across the app */
const SALT = import.meta.env.VITE_ENCRYPTION_SALT || "default-salt";

export const useProviderStore = create<ProviderState>((set, get) => ({
  providers: [],

  /** --------------------------------------------------------------------
   *  LOAD
   * ------------------------------------------------------------------- */
  load: async () => {
    const persisted = await loadProviders();
    set({ providers: persisted });
  },

  // Legacy name kept for backward compatibility
  loadProviders: async () => {
    await get().load();
  },

  /** --------------------------------------------------------------------
   *  CREATE
   * ------------------------------------------------------------------- */
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

  /** --------------------------------------------------------------------
   *  UPDATE (generic field patch)
   * ------------------------------------------------------------------- */
  updateProvider: async (id, updates) => {
    const updated = get().providers.map((p) =>
      p.id === id ? { ...p, ...updates } : p,
    );
    await saveProviders(updated);
    set({ providers: updated });
  },

  /** --------------------------------------------------------------------
   *  DELETE
   * ------------------------------------------------------------------- */
  removeProvider: async (id) => {
    const updated = get().providers.filter((p) => p.id !== id);
    await saveProviders(updated);
    set({ providers: updated });
  },

  // Alias used by older components (`deleteProvider` → `removeProvider`)
  deleteProvider: async (id) => {
    await get().removeProvider(id);
  },

  /** --------------------------------------------------------------------
   *  API‑KEY MANAGEMENT
   * ------------------------------------------------------------------- */
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
}));
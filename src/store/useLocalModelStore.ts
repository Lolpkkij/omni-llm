import { create } from "zustand";
import { LOCAL_MODELS, type LocalModel } from "@/lib/localModels";
import {
  loadLocalModels,
  saveLocalModels,
  loadModelTokens,
  saveModelTokens,
  resetModelTokens,
} from "@/lib/localModelPersistence";

type LocalModelState = {
  /** All known local models – starts with the built‑in catalog and merges any persisted custom entries */
  models: LocalModel[];
  /** Token usage per modelId */
  tokens: Record<string, number>;

  /** Load persisted custom models and token counters */
  initialise: () => Promise<void>;

  /** Add a new custom local model */
  addModel: (model: Omit<LocalModel, "id">) => Promise<void>;

  /** Remove a model by its id */
  removeModel: (id: string) => Promise<void>;

  /** Increment token usage for a model */
  addTokens: (modelId: string, count: number) => Promise<void>;

  /** Reset token usage for a model (or all) */
  resetTokens: (modelId?: string) => Promise<void>;
};

export const useLocalModelStore = create<LocalModelState>((set, get) => ({
  models: [...LOCAL_MODELS],
  tokens: {},

  initialise: async () => {
    const persisted = await loadLocalModels();
    const tokenMap = await loadModelTokens();

    // Merge persisted custom models with the default catalog, avoiding duplicates by id
    const merged =
      persisted?.filter((p) => !LOCAL_MODELS.some((d) => d.id === p.id)) ?? [];

    set({
      models: [...LOCAL_MODELS, ...merged],
      tokens: tokenMap,
    });
  },

  addModel: async (model) => {
    const newModel: LocalModel = { ...model, id: crypto.randomUUID() };
    const updated = [...get().models, newModel];
    await saveLocalModels(updated.filter((m) => !LOCAL_MODELS.some((d) => d.id === m.id)));
    set({ models: updated });
  },

  removeModel: async (id) => {
    const updated = get().models.filter((m) => m.id !== id);
    // Persist only the custom models (exclude built‑in defaults)
    await saveLocalModels(updated.filter((m) => !LOCAL_MODELS.some((d) => d.id === m.id)));
    // Also clean up token usage for the removed model
    await resetModelTokens(id);
    set({ models: updated });
  },

  addTokens: async (modelId, count) => {
    await saveModelTokens(modelId, count);
    const current = get().tokens[modelId] ?? 0;
    set({ tokens: { ...get().tokens, [modelId]: current + count } });
  },

  resetTokens: async (modelId) => {
    await resetModelTokens(modelId);
    if (modelId) {
      const { [modelId]: _, ...rest } = get().tokens;
      set({ tokens: rest });
    } else {
      set({ tokens: {} });
    }
  },
}));
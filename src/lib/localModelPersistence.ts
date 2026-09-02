import localforage from "localforage";
import type { LocalModel } from "./localModels";

/** Keys used in IndexedDB */
const MODELS_KEY = "local_models";
const TOKENS_KEY = "local_model_tokens";

/**
 * Save a custom list of local models (e.g. user‑added or edited entries).
 * The default `LOCAL_MODELS` array is still exported from `localModels.ts`;
 * this function is for runtime‑added models.
 */
export async function saveLocalModels(models: LocalModel[]): Promise<void> {
  await localforage.setItem<LocalModel[]>(MODELS_KEY, models);
}

/**
 * Load the persisted custom local models.
 * Returns `null` if nothing has been saved yet.
 */
export async function loadLocalModels(): Promise<LocalModel[] | null> {
  const stored = await localforage.getItem<LocalModel[]>(MODELS_KEY);
  return stored ?? null;
}

/**
 * Persist token usage for a specific model.
 * `tokens` is the cumulative number of tokens consumed.
 */
export async function saveModelTokens(
  modelId: string,
  tokens: number,
): Promise<void> {
  const existing = (await localforage.getItem<Record<string, number>>(TOKENS_KEY)) ?? {};
  existing[modelId] = (existing[modelId] ?? 0) + tokens;
  await localforage.setItem<Record<string, number>>(TOKENS_KEY, existing);
}

/**
 * Retrieve the token usage map for all persisted local models.
 * Returns an empty object if nothing is stored.
 */
export async function loadModelTokens(): Promise<Record<string, number>> {
  const stored = await localforage.getItem<Record<string, number>>(TOKENS_KEY);
  return stored ?? {};
}

/**
 * Reset token counters for a given model (or all if `modelId` omitted).
 */
export async function resetModelTokens(modelId?: string): Promise<void> {
  if (!modelId) {
    await localforage.removeItem(TOKENS_KEY);
    return;
  }
  const existing = (await localforage.getItem<Record<string, number>>(TOKENS_KEY)) ?? {};
  delete existing[modelId];
  await localforage.setItem<Record<string, number>>(TOKENS_KEY, existing);
}
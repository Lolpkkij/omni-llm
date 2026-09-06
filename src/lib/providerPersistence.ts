import localforage from "localforage";
import type { Provider } from "./providerConfig";

const STORAGE_KEY = "omni_providers_config";

/**
 * Load the persisted provider list.
 * Returns an empty array if nothing is stored yet.
 */
export async function loadProviders(): Promise<Provider[]> {
  const stored = await localforage.getItem<Provider[]>(STORAGE_KEY);
  return stored ?? [];
}

/**
 * Save the full provider list.
 */
export async function saveProviders(providers: Provider[]): Promise<void> {
  await localforage.setItem(STORAGE_KEY, providers);
}
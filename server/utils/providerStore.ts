import { promises as fs } from "fs";
import path from "path";
import { ProviderConfig, ProviderSchema } from "../../src/lib/providerConfig";

const dataFile = path.resolve(process.cwd(), "server/data/providers.json");

// Load providers from JSON file
async function loadProviders(): Promise<ProviderConfig[]> {
  try {
    const content = await fs.readFile(dataFile, "utf-8");
    const parsed = JSON.parse(content);
    return ProviderSchema.array().parse(parsed);
  } catch {
    return [];
  }
}

// Save providers back to JSON file
async function saveProviders(providers: ProviderConfig[]) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(providers, null, 2), "utf-8");
}

// Exported CRUD helpers
export async function getAllProviders(): Promise<ProviderConfig[]> {
  return await loadProviders();
}

export async function addProvider(provider: Omit<ProviderConfig, "id">) {
  const providers = await loadProviders();
  const id = crypto.randomUUID();
  const newProvider = { ...provider, id } as ProviderConfig;
  providers.push(newProvider);
  await saveProviders(providers);
  return newProvider;
}

export async function updateProvider(id: string, updates: Partial<ProviderConfig>) {
  const providers = await loadProviders();
  const idx = providers.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Provider not found");
  const updated = ProviderSchema.parse({ ...providers[idx], ...updates, id });
  providers[idx] = updated;
  await saveProviders(providers);
  return updated;
}

export async function deleteProvider(id: string) {
  const providers = await loadProviders();
  const filtered = providers.filter((p) => p.id !== id);
  await saveProviders(filtered);
}
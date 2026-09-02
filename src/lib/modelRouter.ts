import { Provider } from "@/lib/providerConfig";

export const AUTO_FREE = "auto-free";
export const AUTO_PREMIUM = "auto-premium";

// Model capability definitions
export interface ModelCapability {
  id: string;
  name: string;
  providerId: string;
  providerType: string;
  isFree: boolean;
  contextWindow: number;
  strengths: string[];
  costPer1kTokens?: number;
}

// Built-in model catalog with capabilities
export const MODEL_CATALOG: ModelCapability[] = [
  // Free models
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    providerId: "openai",
    providerType: "openai",
    isFree: true,
    contextWindow: 128000,
    strengths: ["general", "coding", "fast"],
  },
  {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    providerId: "anthropic",
    providerType: "anthropic",
    isFree: true,
    contextWindow: 200000,
    strengths: ["general", "analysis", "fast"],
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    providerId: "google",
    providerType: "gemini",
    isFree: true,
    contextWindow: 1000000,
    strengths: ["general", "long-context", "multimodal"],
  },
  {
    id: "llama-3.1-8b",
    name: "Llama 3.1 8B",
    providerId: "groq",
    providerType: "groq",
    isFree: true,
    contextWindow: 131072,
    strengths: ["general", "fast", "coding"],
  },
  {
    id: "mistral-nemo",
    name: "Mistral NeMo",
    providerId: "mistral",
    providerType: "mistral",
    isFree: true,
    contextWindow: 128000,
    strengths: ["general", "multilingual", "coding"],
  },
  // Premium models
  {
    id: "gpt-4o",
    name: "GPT-4o",
    providerId: "openai",
    providerType: "openai",
    isFree: false,
    contextWindow: 128000,
    strengths: ["reasoning", "coding", "creative", "analysis", "multimodal"],
    costPer1kTokens: 0.005,
  },
  {
    id: "claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    providerId: "anthropic",
    providerType: "anthropic",
    isFree: false,
    contextWindow: 200000,
    strengths: ["reasoning", "coding", "analysis", "creative"],
    costPer1kTokens: 0.003,
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    providerId: "google",
    providerType: "gemini",
    isFree: false,
    contextWindow: 2000000,
    strengths: ["reasoning", "long-context", "multimodal", "analysis"],
    costPer1kTokens: 0.0025,
  },
  {
    id: "llama-3.1-70b",
    name: "Llama 3.1 70B",
    providerId: "groq",
    providerType: "groq",
    isFree: false,
    contextWindow: 131072,
    strengths: ["reasoning", "coding", "analysis"],
    costPer1kTokens: 0.0009,
  },
  {
    id: "mistral-large",
    name: "Mistral Large",
    providerId: "mistral",
    providerType: "mistral",
    isFree: false,
    contextWindow: 128000,
    strengths: ["reasoning", "multilingual", "coding", "analysis"],
    costPer1kTokens: 0.003,
  },
];

// Analyze user request to determine required capabilities
export function analyzeRequest(messages: { role: string; content: string }[]): string[] {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
  const strengths: string[] = ["general"];

  if (/(code|program|function|script|debug|api|database|sql|algorithm)/.test(lastMessage)) {
    strengths.push("coding");
  }
  if (/(reason|logic|prove|analyze|compare|evaluate|critique)/.test(lastMessage)) {
    strengths.push("reasoning");
  }
  if (/(creative|story|poem|write|brainstorm|idea|marketing|copy)/.test(lastMessage)) {
    strengths.push("creative");
  }
  if (/(summarize|extract|analyze|report|research|data)/.test(lastMessage)) {
    strengths.push("analysis");
  }
  if (/(image|picture|photo|visual|diagram|chart)/.test(lastMessage)) {
    strengths.push("multimodal");
  }
  if (lastMessage.length > 50000) {
    strengths.push("long-context");
  }

  return [...new Set(strengths)];
}

// Score models based on request requirements
export function scoreModel(model: ModelCapability, requiredStrengths: string[]): number {
  let score = 0;
  
  for (const strength of requiredStrengths) {
    if (model.strengths.includes(strength)) {
      score += 10;
    }
  }
  
  score += Math.min(model.contextWindow / 100000, 10);
  
  if (model.isFree) score += 5;
  
  if (!model.isFree && model.costPer1kTokens) {
    score += Math.max(0, 10 - model.costPer1kTokens * 1000);
  }
  
  return score;
}

// Get available models from configured providers
export function getAvailableModels(providers: Provider[]): ModelCapability[] {
  const available: ModelCapability[] = [];
  
  for (const provider of providers) {
    if (!provider.enabled) continue;
    if (!provider.encryptedKeys?.length) continue;
    
    const catalogModels = MODEL_CATALOG.filter(m => m.providerType === provider.providerType);
    available.push(...catalogModels);
  }
  
  return available;
}

// Select best model for auto[free]
export function selectBestFreeModel(providers: Provider[], messages: { role: string; content: string }[]): ModelCapability | null {
  const requiredStrengths = analyzeRequest(messages);
  const availableModels = getAvailableModels(providers).filter(m => m.isFree);
  
  if (availableModels.length === 0) return null;
  
  const scored = availableModels.map(m => ({
    model: m,
    score: scoreModel(m, requiredStrengths)
  }));
  
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.model || null;
}

// Select best model for auto[premium] (includes paid)
export function selectBestPremiumModel(providers: Provider[], messages: { role: string; content: string }[]): ModelCapability | null {
  const requiredStrengths = analyzeRequest(messages);
  const availableModels = getAvailableModels(providers);
  
  if (availableModels.length === 0) return null;
  
  const scored = availableModels.map(m => ({
    model: m,
    score: scoreModel(m, requiredStrengths)
  }));
  
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.model || null;
}

// Main router function
export function routeModel(
  mode: "auto-free" | "auto-premium" | "manual",
  providers: Provider[],
  messages: { role: string; content: string }[],
  manualModel?: string
): { model: ModelCapability; provider: Provider } | null {
  
  let selectedModel: ModelCapability | null = null;
  
  if (mode === "auto-free") {
    selectedModel = selectBestFreeModel(providers, messages);
  } else if (mode === "auto-premium") {
    selectedModel = selectBestPremiumModel(providers, messages);
  } else if (mode === "manual" && manualModel) {
    selectedModel = MODEL_CATALOG.find(m => m.id === manualModel) || null;
  }
  
  if (!selectedModel) return null;
  
  const provider = providers.find(p => 
    p.enabled && 
    p.encryptedKeys?.length && 
    p.providerType === selectedModel!.providerType
  );
  
  if (!provider) return null;
  
  return { model: selectedModel, provider };
}
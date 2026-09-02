export type LocalModel = {
  /** Universally unique identifier for the model entry */
  id: string;
  /** Friendly display name shown in the UI */
  name: string;
  /** Underlying engine/provider */
  provider: "ollama" | "lmstudio" | "huggingface";
  /** Model identifier used by the provider (e.g. “llama3”, “phi-2”, “meta‑llama/Meta‑Llama‑3‑8B‑Instruct”) */
  modelId: string;
  /** Base URL of the chat endpoint */
  endpoint: string;
  /** Whether the model may need to be pulled first (relevant for Ollama) */
  pullRequired?: boolean;
  /** Optional custom headers – can contain placeholders (e.g. {{HF_TOKEN}}) that are resolved at runtime */
  customHeaders?: Record<string, string>;
};

/** Default catalog – can be extended by the user via the Providers UI */
export const LOCAL_MODELS: LocalModel[] = [
  {
    id: "a1f9c4d2-1e5b-4c57-8f12-3c6d2e5b9c1a",
    name: "Ollama – Llama 3 8B‑Instruct",
    provider: "ollama",
    modelId: "llama3",
    endpoint: "http://127.0.0.1:11434/api/chat",
    pullRequired: true,
  },
  {
    id: "b2e8d3f5-9c4a-4b61-9d23-7f1a2c6e8d4b",
    name: "Ollama – Mixtral 8×7B‑Instruct",
    provider: "ollama",
    modelId: "mixtral",
    endpoint: "http://127.0.0.1:11434/api/chat",
    pullRequired: true,
  },
  {
    id: "c3f1a2b7-5d8e-4c9a-8f90-6e2b3d4c5f6a",
    name: "LM‑Studio – Phi‑2",
    provider: "lmstudio",
    modelId: "phi-2",
    endpoint: "http://127.0.0.1:1234/v1/chat/completions",
    pullRequired: false,
  },
  {
    id: "d4e2f9a1-7c3b-4d5f-9a01-8b2c3e4f5a6b",
    name: "Hugging Face – Mistral‑7B‑Instruct",
    provider: "huggingface",
    modelId: "mistralai/Mistral-7B-Instruct-v0.2",
    endpoint:
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
    pullRequired: false,
    customHeaders: {
      Authorization: "Bearer {{HF_TOKEN}}",
    },
  },
];
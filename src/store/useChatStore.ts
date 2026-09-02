import { create } from "zustand";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatState = {
  selectedModel: string;
  selectedProvider: string;
  messages: Message[];
  apiKeys: Record<string, string>; 
  usageData: Record<string, any>;
  unifiedKey: string;

  setSelectedModel: (model: string) => void;
  setSelectedProvider: (provider: string) => void;
  setApiKeys: (keys: Record<string, string>) => void;
  setUsageData: (data: Record<string, any>) => void;
  setUnifiedKey: (key: string) => void;

  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string, replaceLast?: boolean) => void;
  clearChat: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  selectedModel: "OpenAI",
  selectedProvider: "openai",
  messages: [],
  apiKeys: {},
  usageData: {},
  unifiedKey: "",

  setSelectedModel: (model) => set({ selectedModel: model }),
  setSelectedProvider: (provider) => set({ selectedProvider: provider }),
  setApiKeys: (keys) => set({ apiKeys: keys }),
  setUsageData: (data) => set({ usageData: data }),
  setUnifiedKey: (key) => set({ unifiedKey: key }),

  addUserMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { role: "user" as const, content }
      ]
    })),

  addAssistantMessage: (content, replaceLast = false) =>
    set((state) => {
      if (replaceLast && state.messages.length) {
        const last = state.messages[state.messages.length - 1];
        if (last.role === "assistant") {
          const updated: Message[] = [
            ...state.messages.slice(0, -1),
            { role: "assistant" as const, content }
          ];
          return { messages: updated };
        }
      }

      const newMessages: Message[] = [
        ...state.messages,
        { role: "assistant" as const, content }
      ];
      return { messages: newMessages };
    }),

  clearChat: () => set({ messages: [] })
}));
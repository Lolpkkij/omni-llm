import { create } from "zustand";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatState = {
  /** ID of the currently selected provider (e.g., a UUID from the Provider store) */
  selectedProviderId: string;
  /** Model name to send to the provider (e.g., gpt‑4o) */
  selectedModel: string;
  messages: Message[];
  apiKeys: Record<string, string>;
  usageData: Record<string, any>;
  unifiedKey: string;

  /** Setters */
  setSelectedProviderId: (id: string) => void;
  setSelectedModel: (model: string) => void;
  setApiKeys: (keys: Record<string, string>) => void;
  setUsageData: (data: Record<string, any>) => void;
  setUnifiedKey: (key: string) => void;

  /** Message helpers */
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string, replaceLast?: boolean) => void;
  clearChat: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  selectedProviderId: "", // will be populated from the Provider store UI
  selectedModel: "gpt-4o",
  messages: [],
  apiKeys: {},
  usageData: {},
  unifiedKey: "",

  setSelectedProviderId: (id) => set({ selectedProviderId: id }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setApiKeys: (keys) => set({ apiKeys: keys }),
  setUsageData: (data) => set({ usageData: data }),
  setUnifiedKey: (key) => set({ unifiedKey: key }),

  addUserMessage: (content) =>
    set((state) => ({
      messages: [...state.messages, { role: "user", content }],
    })),

  addAssistantMessage: (content, replaceLast = false) => {
    set((state) => {
      if (replaceLast && state.messages.length) {
        const last = state.messages[state.messages.length - 1];
        if (last.role === "assistant") {
          const updated: Message[] = [
            ...state.messages.slice(0, -1),
            { role: "assistant", content },
          ];
          return { messages: updated };
        }
      }

      const newMessages: Message[] = [
        ...state.messages,
        { role: "assistant", content },
      ];
      return { messages: newMessages };
    });
  },

  clearChat: () => set({ messages: [] }),
}));
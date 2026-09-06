import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ModelParams = {
  temperature: number;
  maxTokens: number;
  topP: number;
  useCache: boolean;
};

type ChatState = {
  selectedProviderId: string;
  selectedModel: string;
  messages: Message[];
  apiKeys: Record<string, string>;
  usageData: Record<string, any>;
  unifiedKey: string;
  params: ModelParams;

  setSelectedProviderId: (id: string) => void;
  setSelectedModel: (model: string) => void;
  setApiKeys: (keys: Record<string, string>) => void;
  setUsageData: (data: Record<string, any>) => void;
  setUnifiedKey: (key: string) => void;
  setParams: (params: Partial<ModelParams>) => void;

  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string, replaceLast?: boolean) => void;
  clearChat: () => void;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      selectedProviderId: "",
      selectedModel: "gpt-4o-mini",
      messages: [],
      apiKeys: {},
      usageData: {},
      unifiedKey: "",
      params: {
        temperature: 0.7,
        maxTokens: 2048,
        topP: 1,
        useCache: true,
      },

      setSelectedProviderId: (id) => set({ selectedProviderId: id }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setApiKeys: (keys) => set({ apiKeys: keys }),
      setUsageData: (data) => set({ usageData: data }),
      setUnifiedKey: (key) => set({ unifiedKey: key }),
      setParams: (newParams) => set((state) => ({ params: { ...state.params, ...newParams } })),

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
    }),
    {
      name: "omni-chat-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        messages: state.messages, 
        selectedModel: state.selectedModel,
        params: state.params
      }),
    }
  )
);
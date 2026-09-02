import { create } from "zustand";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatState = {
  selectedModel: string;
  messages: Message[];
  setSelectedModel: (model: string) => void;
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string, replaceLast?: boolean) => void;
  clearChat: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  selectedModel: "OpenAI",
  messages: [],
  setSelectedModel: (model) => set({ selectedModel: model }),

  addUserMessage: (content) =>
    set((state) => ({
      messages: [...state.messages, { role: "user", content }],
    })),

  addAssistantMessage: (content, replaceLast = false) =>
    set((state) => {
      if (replaceLast && state.messages.length) {
        const last = state.messages[state.messages.length - 1];
        if (last.role === "assistant") {
          const updated = [
            ...state.messages.slice(0, -1),
            { role: "assistant", content },
          ];
          return { messages: updated };
        }
      }
      return {
        messages: [...state.messages, { role: "assistant", content }],
      };
    }),

  clearChat: () => set({ messages: [] })
}));
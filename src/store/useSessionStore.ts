import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  id: string;
  isEditing?: boolean;
  isDeleted?: boolean;
};

interface SessionState {
  sessions: ChatSession[];
  currentSessionId: string | null;

  createSession: (modelId: string, systemPrompt?: string) => string;
  removeSession: (id: string) => void;
  setCurrentSession: (id: string) => void;
  updateSession: (id: string, updates: Partial<ChatSession>) => void;
  addMessageToSession: (sessionId: string, message: Omit<ChatMessage, 'timestamp' | 'id'>) => void;
  editMessageInSession: (sessionId: string, messageId: string, newContent: string) => void;
  deleteMessageInSession: (sessionId: string, messageId: string) => void;
  renameSession: (id: string, title: string) => void;
  clearAllSessions: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,

      createSession: (modelId, systemPrompt) => {
        const id = crypto.randomUUID();
        const newSession: ChatSession = {
          id,
          title: "New Conversation",
          messages: [],
          systemPrompt: systemPrompt || "",
          modelId,
          settings: {
            temperature: 0.7,
            maxTokens: 2048,
          },
          updatedAt: Date.now(),
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: id,
        }));
        return id;
      },

      removeSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          currentSessionId: state.currentSessionId === id ? (get().sessions[1]?.id || null) : state.currentSessionId,
        }));
      },

      setCurrentSession: (id) => set({ currentSessionId: id }),

      updateSession: (id, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
          ),
        }));
      },

      addMessageToSession: (sessionId, message) => {
        const messageWithId = {
          ...message,
          id: crypto.randomUUID(),
          timestamp: Date.now()
        };
        set((state) => {
          const sessions = state.sessions.map((s) => {
            if (s.id === sessionId) {
              const newMessages = [...s.messages, messageWithId];
              let title = s.title;
              if (s.messages.length === 0 && message.role === 'user') {
                title = message.content.substring(0, 30) + (message.content.length > 30 ? "..." : "");
              }
              return { ...s, messages: newMessages, title, updatedAt: Date.now() };
            }
            return s;
          });
          return { sessions };
        });
      },

      editMessageInSession: (sessionId, messageId, newContent) => {
        set((state) => {
          const sessions = state.sessions.map((s) => {
            if (s.id === sessionId) {
              const updatedMessages = s.messages.map((m) =>
                m.id === messageId ? { ...m, content: newContent, isEditing: false } : m
              );
              return { ...s, messages: updatedMessages };
            }
            return s;
          });
          return { sessions };
        });
      },

      deleteMessageInSession: (sessionId, messageId) => {
        set((state) => {
          const sessions = state.sessions.map((s) => {
            if (s.id === sessionId) {
              const updatedMessages = s.messages.filter((m) => m.id !== messageId);
              return { ...s, messages: updatedMessages };
            }
            return s;
          });
          return { sessions };
        });
      },

      renameSession: (id, title) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, title, updatedAt: Date.now() } : s
          ),
        }));
      },

      clearAllSessions: () => set({ sessions: [], currentSessionId: null }),
    }),
    {
      name: "omni-sessions-v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
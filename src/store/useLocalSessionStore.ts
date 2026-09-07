import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  createSession,
  updateSession,
  getAllSessions,
  deleteSession,
  clearAllSessions,
  type ChatSession
} from "@/lib/localStorage";

interface SessionState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  loading: boolean;
  error: string | null;

  loadSessions: () => Promise<void>;
  createSession: (modelId: string, systemPrompt?: string) => Promise<string>;
  removeSession: (id: string) => Promise<void>;
  setCurrentSession: (id: string) => void;
  updateSession: (id: string, updates: Partial<ChatSession>) => Promise<void>;
  addMessageToSession: (sessionId: string, message: Omit<ChatMessage, 'timestamp' | 'id'>) => Promise<void>;
  editMessageInSession: (sessionId: string, messageId: string, newContent: string) => Promise<void>;
  deleteMessageInSession: (sessionId: string, messageId: string) => Promise<void>;
  renameSession: (id: string, title: string) => Promise<void>;
  clearAllSessions: () => Promise<void>;
}

export const useLocalSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      loading: false,
      error: null,

      loadSessions: async () => {
        set({ loading: true, error: null });
        try {
          const sessions = await getAllSessions();
          set({ sessions, loading: false });
        } catch (error) {
          set({ error: "Failed to load sessions", loading: false });
        }
      },

      createSession: async (modelId, systemPrompt) => {
        set({ loading: true, error: null });
        try {
          const newSession = await createSession({
            title: "New Conversation",
            messages: [],
            systemPrompt: systemPrompt || "",
            modelId,
            settings: {
              temperature: 0.7,
              maxTokens: 2048,
            },
          });

          set((state) => ({
            sessions: [newSession, ...state.sessions],
            currentSessionId: newSession.id,
            loading: false,
          }));

          return newSession.id;
        } catch (error) {
          set({ error: "Failed to create session", loading: false });
          throw error;
        }
      },

      removeSession: async (id) => {
        set({ loading: true, error: null });
        try {
          await deleteSession(id);
          set((state) => ({
            sessions: state.sessions.filter(s => s.id !== id),
            currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
            loading: false,
          }));
        } catch (error) {
          set({ error: "Failed to remove session", loading: false });
        }
      },

      setCurrentSession: (id) => {
        set({ currentSessionId: id });
      },

      updateSession: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const updatedSession = await updateSession(id, updates);
          if (updatedSession) {
            set((state) => ({
              sessions: state.sessions.map(s =>
                s.id === id ? updatedSession : s
              ),
              loading: false,
            }));
          }
        } catch (error) {
          set({ error: "Failed to update session", loading: false });
        }
      },

      addMessageToSession: async (sessionId, message) => {
        set({ loading: true, error: null });
        try {
          const timestamp = Date.now();
          const id = crypto.randomUUID();
          const updatedSession = await updateSession(sessionId, {
            messages: [
              ...(get().sessions.find(s => s.id === sessionId)?.messages || []),
              { ...message, timestamp, id }
            ]
          });

          if (updatedSession) {
            set((state) => ({
              sessions: state.sessions.map(s =>
                s.id === sessionId ? updatedSession : s
              ),
              loading: false,
            }));
          }
        } catch (error) {
          set({ error: "Failed to add message", loading: false });
        }
      },

      editMessageInSession: async (sessionId, messageId, newContent) => {
        set({ loading: true, error: null });
        try {
          const session = get().sessions.find(s => s.id === sessionId);
          if (!session) return;

          const updatedMessages = session.messages.map(m =>
            m.id === messageId ? { ...m, content: newContent } : m
          );

          const updatedSession = await updateSession(sessionId, {
            messages: updatedMessages
          });

          if (updatedSession) {
            set((state) => ({
              sessions: state.sessions.map(s =>
                s.id === sessionId ? updatedSession : s
              ),
              loading: false,
            }));
          }
        } catch (error) {
          set({ error: "Failed to edit message", loading: false });
        }
      },

      deleteMessageInSession: async (sessionId, messageId) => {
        set({ loading: true, error: null });
        try {
          const session = get().sessions.find(s => s.id === sessionId);
          if (!session) return;

          const updatedMessages = session.messages.map(m =>
            m.id === messageId ? { ...m, isDeleted: true } : m
          );

          const updatedSession = await updateSession(sessionId, {
            messages: updatedMessages
          });

          if (updatedSession) {
            set((state) => ({
              sessions: state.sessions.map(s =>
                s.id === sessionId ? updatedSession : s
              ),
              loading: false,
            }));
          }
        } catch (error) {
          set({ error: "Failed to delete message", loading: false });
        }
      },

      renameSession: async (id, title) => {
        set({ loading: true, error: null });
        try {
          const updatedSession = await updateSession(id, { title });
          if (updatedSession) {
            set((state) => ({
              sessions: state.sessions.map(s =>
                s.id === id ? updatedSession : s
              ),
              loading: false,
            }));
          }
        } catch (error) {
          set({ error: "Failed to rename session", loading: false });
        }
      },

      clearAllSessions: async () => {
        set({ loading: true, error: null });
        try {
          await clearAllSessions();
          set({ sessions: [], currentSessionId: null, loading: false });
        } catch (error) {
          set({ error: "Failed to clear sessions", loading: false });
        }
      },
    }),
    {
      name: "omni-local-sessions",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentSessionId: state.currentSessionId,
      }),
    }
  )
);
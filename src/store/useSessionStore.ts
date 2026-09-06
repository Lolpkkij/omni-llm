import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { encryptData, decryptData, generateSalt } from "@/lib/encryption";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  id: string;
  isEditing?: boolean;
  isDeleted?: boolean;
  isLoading?: boolean;
  error?: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  systemPrompt: string;
  modelId: string;
  settings: {
    temperature: number;
    maxTokens: number;
  };
  updatedAt: number;
};

interface SessionState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  encryptionSalt: string;

  createSession: (modelId: string, systemPrompt?: string) => string;
  removeSession: (id: string) => void;
  setCurrentSession: (id: string) => void;
  updateSession: (id: string, updates: Partial<ChatSession>) => void;
  addMessageToSession: (sessionId: string, message: Omit<ChatMessage, 'timestamp' | 'id'>) => void;
  editMessageInSession: (sessionId: string, messageId: string, newContent: string) => void;
  deleteMessageInSession: (sessionId: string, messageId: string) => void;
  renameSession: (id: string, title: string) => void;
  clearAllSessions: () => void;
  encryptSessionData: (data: any) => string;
  decryptSessionData: (encryptedData: string) => any;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      encryptionSalt: generateSalt(),

      // Enhanced encryption for session data
      encryptSessionData: (data) => {
        const salt = get().encryptionSalt;
        const encrypted = encryptData(JSON.stringify(data), salt);
        return JSON.stringify(encrypted);
      },

      // Enhanced decryption for session data
      decryptSessionData: (encryptedData) => {
        try {
          const parsed = JSON.parse(encryptedData);
          const decrypted = decryptData(parsed);
          return JSON.parse(decrypted);
        } catch (e) {
          console.error("Decryption failed:", e);
          return null;
        }
      },

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

        // Encrypt the session data before storing
        const encryptedSession = get().encryptSessionData(newSession);

        set((state) => ({
          sessions: [encryptedSession, ...state.sessions],
          currentSessionId: id,
        }));
        return id;
      },

      removeSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter(s => s.id !== id),
          currentSessionId: state.currentSessionId === id ? null : state.currentSessionId
        }));
      },

      setCurrentSession: (id) => {
        set({ currentSessionId: id });
      },

      updateSession: (id, updates) => {
        set((state) => ({
          sessions: state.sessions.map(s =>
            s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
          )
        }));
      },

      addMessageToSession: (sessionId, message) => {
        const timestamp = Date.now();
        const id = crypto.randomUUID();

        set((state) => ({
          sessions: state.sessions.map(s =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: [...s.messages, { ...message, timestamp, id }],
                  updatedAt: timestamp
                }
              : s
          )
        }));
      },

      editMessageInSession: (sessionId, messageId, newContent) => {
        set((state) => ({
          sessions: state.sessions.map(s =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: s.messages.map(m =>
                    m.id === messageId ? { ...m, content: newContent } : m
                  ),
                  updatedAt: Date.now()
                }
              : s
          )
        }));
      },

      deleteMessageInSession: (sessionId, messageId) => {
        set((state) => ({
          sessions: state.sessions.map(s =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: s.messages.map(m =>
                    m.id === messageId ? { ...m, isDeleted: true } : m
                  ),
                  updatedAt: Date.now()
                }
              : s
          )
        }));
      },

      renameSession: (id, title) => {
        set((state) => ({
          sessions: state.sessions.map(s =>
            s.id === id ? { ...s, title, updatedAt: Date.now() } : s
          )
        }));
      },

      // Enhanced clearAllSessions with secure deletion
      clearAllSessions: () => {
        // Clear the encryption salt to prevent decryption of old data
        set({ encryptionSalt: generateSalt() });
        set({ sessions: [], currentSessionId: null });
      },
    }),
    {
      name: "omni-sessions-v1",
      storage: createJSONStorage(() => localStorage),
      // Enhanced serialization with encryption
      partialize: (state) => ({
        sessions: state.sessions.map(session => get().encryptSessionData(session)),
        currentSessionId: state.currentSessionId,
        encryptionSalt: state.encryptionSalt
      }),
      // Enhanced deserialization with decryption
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Migration logic for older versions
          return {
            ...persistedState,
            encryptionSalt: generateSalt()
          };
        }
        return persistedState;
      }
    }
  )
);
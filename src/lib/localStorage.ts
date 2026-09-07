// Simple local storage implementation for chat sessions using browser's localStorage.
// This is a lightweight mock; for production you may replace it with IndexedDB or a proper DB.

// Define a minimal ChatSession interface matching the store's expectations
interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  systemPrompt: string;
  modelId: string;
  settings: {
    temperature: number;
    maxTokens: number;
  };
  updatedAt: number;
}

const STORAGE_KEY = "omni-local-sessions";

// Helper to read all sessions from localStorage
const readSessions = (): ChatSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as ChatSession[];
    }
    return [];
  } catch {
    return [];
  }
};

// Helper to write sessions back to localStorage
const writeSessions = (sessions: ChatSession[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

// Create a new session and persist it
export const createSession = (
  session: Omit<ChatSession, "id" | "updatedAt">
): ChatSession => {
  const sessions = readSessions();
  const newSession: ChatSession = {
    ...session,
    id: crypto.randomUUID(),
    updatedAt: Date.now(),
  };
  sessions.unshift(newSession);
  writeSessions(sessions);
  return newSession;
};

// Update an existing session (partial updates allowed)
const updateSession = async (
  id: string,
  updates: Partial<ChatSession>
): Promise<ChatSession | null> => {
  const sessions = readSessions();
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const updated: ChatSession = {
    ...sessions[idx],
    ...updates,
    updatedAt: Date.now(),
  };
  sessions[idx] = updated;
  writeSessions(sessions);
  return updated;
};

// Retrieve all sessions
const getAllSessions = async (): Promise<ChatSession[]> => {
  return readSessions();
};

// Delete a session by id
const deleteSession = async (id: string): Promise<boolean> => {
  const sessions = readSessions();
  const filtered = sessions.filter((s) => s.id !== id);
  if (filtered.length === sessions.length) return false;
  writeSessions(filtered);
  return true;
};

export { updateSession, getAllSessions, deleteSession };

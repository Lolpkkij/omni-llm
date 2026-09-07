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
const writeSessions = (sessions: ChatSession[]): void => {
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

  // Use unshift only if sessions is an array
  const updatedSessions = Array.isArray(sessions) ? [newSession, ...sessions] : [newSession];
  writeSessions(updatedSessions);
  return newSession;
};

// Update an existing session (partial updates allowed)
export const updateSession = async (
  id: string,
  updates: Partial<ChatSession>
): Promise<ChatSession | null> => {
  const sessions = readSessions();
  const idx = Array.isArray(sessions) ? sessions.findIndex((s) => s.id === id) : -1;
  if (idx === -1) return null;
    // Create a new array with the updated session
    const updatedSessions = [...sessions];
    updatedSessions[idx] = {
      ...sessions[idx],
      ...updates,
      updatedAt: Date.now(),
    };
  
    writeSessions(updatedSessions);
    return sessions[idx] as ChatSession;
};

// Retrieve all sessions
export const getAllSessions = async (): Promise<ChatSession[]> => {
  return readSessions();
};

// Delete a session by id
export const deleteSession = async (id: string): Promise<boolean> => {
  const sessions = readSessions();
  const filtered = Array.isArray(sessions) ? sessions.filter((s) => s.id !== id) : [];

  if (filtered.length === sessions.length) return false;
  writeSessions(filtered);
  return true;
};

// Clear all sessions
export const clearAllSessions = async (): Promise<void> => {
  localStorage.removeItem(STORAGE_KEY);
};
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type RequestLog = {
  id: string;
  timestamp: number;
  method: string;
  path: string;
  model: string;
  provider: string;
  status: 'success' | 'error' | 'pending';
  duration?: number;
  tokens?: number;
  error?: string;
};

interface LogState {
  logs: RequestLog[];
  addLog: (log: Omit<RequestLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
}

export const useLogStore = create<LogState>()(
  persist(
    (set) => ({
      logs: [],
      addLog: (log) => set((state) => ({
        logs: [
          { 
            ...log, 
            id: crypto.randomUUID(), 
            timestamp: Date.now() 
          }, 
          ...state.logs
        ].slice(0, 50) // Keep last 50 logs
      })),
      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'omni-logs-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
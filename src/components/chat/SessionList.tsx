"use client";

import React from 'react';
import { Plus, Search, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Define ChatSession type
type ChatSession = {
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
};

interface SessionListProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  sessionSearch: string;
  setSessionSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setCurrentSession: (id: string) => void;
  createSession: (modelId: string, systemPrompt?: string) => Promise<string>;
  removeSession: (id: string) => void;
  editingId: string | null;
  editTitle: string;
  setEditingId: (id: string | null) => void;
  setEditTitle: (title: string) => void;
  renameSession: (id: string, title: string) => Promise<void>;
}

export const SessionList = ({
  sessions,
  currentSessionId,
  sessionSearch,
  setSessionSearch,
  setCurrentSession,
  createSession,
  removeSession,
  editingId,
  editTitle,
  setEditingId,
  setEditTitle,
  renameSession
}: SessionListProps) => {
  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <Button
        onClick={async () => {
          await createSession("auto-free");
        }}
        className="w-full bg-[#6366F1] hover:bg-[#4f46e5] text-white rounded-xl mb-4 flex items-center justify-center gap-2 shadow-lg shadow-[#6366F1]/20"
      >
        <Plus size={18} /> New Conversation
      </Button>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
        <input
          className="w-full bg-gray-900/50 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:ring-1 ring-[#6366F1] outline-none"
          placeholder="Search chats..."
          value={sessionSearch}
          onChange={setSessionSearch}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
        {filteredSessions.map(s => (
          <div
            key={s.id}
            className={cn(
              "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border border-transparent",
              currentSessionId === s.id ? "bg-gray-800 border-gray-700 text-white" : "text-gray-500 hover:bg-gray-900/50 hover:text-gray-300"
            )}
            onClick={() => { setCurrentSession(s.id); }}
          >
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              <div className={cn(
                "w-2 h-2 rounded-full shrink-0",
                currentSessionId === s.id ? "bg-[#6366F1] shadow-[0_0_8px_#6366F1]" : "bg-gray-700"
              )} />
              {editingId === s.id ? (
                <input
                  autoFocus
                  className="bg-transparent border-none outline-none text-xs w-full"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onBlur={() => { renameSession(s.id, editTitle); setEditingId(null); }}
                  onKeyDown={e => e.key === 'Enter' && (renameSession(s.id, editTitle), setEditingId(null))}
                />
              ) : (
                <span className="text-xs font-semibold truncate">{s.title}</span>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => { e.stopPropagation(); setEditingId(s.id); setEditTitle(s.title); }} className="p-1 hover:text-white"><Edit2 size={12} /></button>
              <button onClick={(e) => { e.stopPropagation(); removeSession(s.id); }} className="p-1 hover:text-red-400"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
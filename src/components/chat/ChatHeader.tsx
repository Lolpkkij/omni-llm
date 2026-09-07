"use client";

import React from 'react';
import { Send, Bot, Plus, History, Trash2, Sparkles, Zap, Settings2, X, Terminal, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/store/useSessionStore';
import ModelSelector from '@/components/ModelSelector';

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

interface ChatHeaderProps {
  input: string;
  setInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSend: () => void;
  hasAnyProvider: boolean;
  currentSession: ChatSession | null;
  showSystemPrompt: boolean;
  setShowSystemPrompt: (val: boolean) => void;
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  showHistory: boolean;
  setShowHistory: (val: boolean) => void;
  showSubscriptionModal: boolean;
  setShowSubscriptionModal: (val: boolean) => void;
  editingId: string | null;
  editTitle: string;
  setEditingId: (id: string | null) => void;
  setEditTitle: (title: string) => void;
  renameSession: (id: string, title: string) => Promise<void>;
  currentSessionId: string | null;
  templates: any[];
  sessions: any[];
  removeSession: (id: string) => void;
  setCurrentSession: (id: string) => void;
  createSession: (modelId: string, systemPrompt?: string) => Promise<string>;
  providers: any[];
  checkAccess: (feature: string) => boolean;
}

export const ChatHeader = ({
  input,
  setInput,
  handleSend,
  hasAnyProvider,
  currentSession,
  showSystemPrompt,
  setShowSystemPrompt,
  showSettings,
  setShowSettings,
  showHistory,
  setShowHistory,
  showSubscriptionModal,
  setShowSubscriptionModal,
  editingId,
  editTitle,
  setEditingId,
  setEditTitle,
  renameSession,
  currentSessionId,
  templates,
  sessions,
  removeSession,
  setCurrentSession,
  createSession,
  providers,
  checkAccess
}: ChatHeaderProps) => {
  const updateSession = useSessionStore(state => state.updateSession);

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setShowHistory(!showHistory)} className="lg:hidden text-gray-500">
            <History size={20} />
          </Button>
          <div className="hidden sm:flex items-center gap-3">
            <div className="p-2 bg-[#6366F1]/10 text-[#6366F1] rounded-xl">
              <Bot size={18} />
            </div>
            <div>
              <span className="font-bold text-sm text-white block truncate max-w-[200px]">
                {currentSession?.title || "Chat Studio"}
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Encrypted Session</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSystemPrompt(!showSystemPrompt)}
            className={cn(
              "text-xs font-bold rounded-xl h-9 px-3 gap-2",
              showSystemPrompt ? "bg-emerald-500/10 text-emerald-500" : "text-gray-500 hover:text-white"
            )}
          >
            <Terminal size={14} /> Persona
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`${window.location.origin}/api/v1/models`, '_blank')}
            className="text-xs font-bold rounded-xl h-9 px-3 gap-2 text-gray-500 hover:text-white"
          >
            <Download size={14} /> Export
          </Button>
          <ModelSelector
            value={currentSession?.modelId || "auto-free"}
            onChange={(val) => {
              if (currentSessionId) {
                updateSession(currentSessionId, { modelId: val });
              }
            }}
            providers={providers}
            disabled={!hasAnyProvider}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className={cn("h-9 w-9", showSettings ? "text-[#6366F1] bg-[#6366F1]/10" : "text-gray-500 hover:text-white")}
          >
            <Settings2 size={18} />
          </Button>
        </div>
      </div>

      {showSystemPrompt && (
        <div className="p-4 border-b border-gray-800 bg-emerald-500/5 animate-in slide-in-from-top-2">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">System Instructions</span>
              <button onClick={() => setShowSystemPrompt(false)} className="text-gray-500 hover:text-white">
                <X size={14} />
              </button>
            </div>
            <textarea
              className="w-full bg-gray-900 border border-emerald-500/20 rounded-xl p-3 text-xs text-gray-300 outline-none focus:ring-1 ring-emerald-500/50 resize-none"
              placeholder="Assign a role to the AI (e.g. 'You are a professional Python expert'). This instruction persists for this conversation."
              rows={2}
              value={currentSession?.systemPrompt || ''}
              onChange={(e) => {
                if (currentSessionId) {
                  updateSession(currentSessionId, { systemPrompt: e.target.value });
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};
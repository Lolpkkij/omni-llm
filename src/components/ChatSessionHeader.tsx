"use client";

import React from 'react';
import { Bot, Settings, Terminal, History, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSessionStore } from '@/store/useSessionStore';
import ModelSelector from '@/components/ModelSelector';

interface ChatSessionHeaderProps {
  showHistory: boolean;
  setShowHistory: (val: boolean) => void;
  showSystemPrompt: boolean;
  setShowSystemPrompt: (val: boolean) => void;
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
}

const ChatSessionHeader = ({
  showHistory,
  setShowHistory,
  showSystemPrompt,
  setShowSystemPrompt,
  showSettings,
  setShowSettings
}: ChatSessionHeaderProps) => {
  const { currentSessionId, sessions, updateSession } = useSessionStore();
  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
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
          className="text-xs font-bold rounded-xl h-9 px-3 gap-2 text-gray-500 hover:text-white"
        >
          <Terminal size={14} /> Persona
        </Button>
        <ModelSelector
          value={currentSession?.modelId || "auto-free"}
          onChange={(val) => {
            if (currentSessionId) {
              updateSession(currentSessionId, { modelId: val });
            }
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
          className="h-9 w-9 text-gray-500 hover:text-white"
        >
          <Settings size={18} />
        </Button>
      </div>
    </div>
  );
};

export default ChatSessionHeader;
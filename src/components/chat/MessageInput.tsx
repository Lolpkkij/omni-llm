"use client";

import React from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  input: string;
  setInput: (val: string) => void;
  handleSend: () => void;
  hasAnyProvider: boolean;
  isTyping: boolean;
}

export const MessageInput = ({
  input,
  setInput,
  handleSend,
  hasAnyProvider,
  isTyping
}: MessageInputProps) => {
  return (
    <div className="p-4 md:p-8 border-t border-gray-800 bg-gray-900/30">
      <div className="max-w-4xl mx-auto relative group">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={hasAnyProvider ? "Describe what you need..." : "Please configure an AI provider first"}
          className="w-full bg-gray-800/80 backdrop-blur-xl text-white rounded-2xl pl-5 pr-16 py-4 outline-none border border-gray-700 focus:border-[#6366F1] focus:ring-4 ring-[#6366F1]/10 transition-all resize-none shadow-2xl"
          disabled={!hasAnyProvider || isTyping}
        />
        <button
          onClick={handleSend}
          className="absolute right-3.5 bottom-3.5 p-2.5 bg-[#6366F1] text-white rounded-xl hover:bg-[#4f46e5] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg shadow-[#6366F1]/40"
          disabled={!input.trim() || isTyping || !hasAnyProvider}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};
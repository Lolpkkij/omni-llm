"use client";

import React from 'react';
import MessageBubble from '@/components/MessageBubble';
import { ArrowDown, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: any[];
  isTyping: boolean;
  showScrollBtn: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  handleEditClick: (message: { id: string; content: string }) => void;
  handleDeleteClick: (messageId: string) => void;
}

export const MessageList = ({
  messages,
  isTyping,
  showScrollBtn,
  scrollRef,
  handleEditClick,
  handleDeleteClick
}: MessageListProps) => {
  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar relative">
      {!messages.length && (
        <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-6">
          <div className="w-24 h-24 bg-gray-900/50 rounded-3xl flex items-center justify-center border border-gray-800 shadow-2xl">
            <Bot size={48} className="text-[#6366F1] opacity-50" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-white">OmniLLM Workspace</h3>
            <p className="text-sm max-w-xs text-gray-500 mx-auto">Select a provider and model to begin. Your keys are managed securely on the gateway.</p>
          </div>
        </div>
      )}
      {messages.map((msg, i) => (
        <MessageBubble
          key={msg.id}
          role={msg.role}
          content={msg.content}
          id={msg.id}
          isDeleted={msg.isDeleted}
          timestamp={msg.timestamp}
          isLoading={msg.isLoading}
          error={msg.error}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      ))}
      {isTyping && (
        <div className="flex justify-start mb-4 animate-in fade-in slide-in-from-left-2">
          <div className="bg-gray-800/50 text-gray-400 rounded-2xl px-5 py-3 rounded-tl-none text-xs border border-gray-700 flex items-center gap-3">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-[#6366F1] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-[#6366F1] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-[#6366F1] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Omni is thinking...</span>
          </div>
        </div>
      )}

      {showScrollBtn && (
        <button
          onClick={() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }
          }}
          className="fixed bottom-32 right-8 p-3 bg-[#6366F1] text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-30"
        >
          <ArrowDown size={20} />
        </button>
      )}
    </div>
  );
};
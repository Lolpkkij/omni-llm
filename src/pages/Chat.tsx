import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Trash2, RotateCcw } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import MessageBubble from '@/components/MessageBubble';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { encryptKey } from '@/lib/encryption';
import { useProviderStore } from '@/store/useProviderStore';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const Chat = () => {
  const {
    selectedProviderId,
    selectedModel,
    messages,
    setSelectedModel,
    setSelectedProviderId,
    addUserMessage,
    addAssistantMessage,
    clearChat,
  } = useChatStore();

  const { providers } = useProviderStore();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedProviderId && providers.length > 0) {
      const firstEnabled = providers.find(p => p.enabled) || providers[0];
      setSelectedProviderId(firstEnabled.id);
    }
  }, [providers, selectedProviderId, setSelectedProviderId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!selectedProviderId) {
      toast.error('Please select a provider before sending a message.');
      return;
    }

    const userText = input;
    setInput('');
    addUserMessage(userText);
    setIsTyping(true);

    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProviderId,
          model: selectedModel,
          messages: [...messages, { role: 'user', content: userText }],
          encryptedKey: encryptKey('placeholder'),
        }),
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error('Rate limit exceeded. Please slow down.');
        if (response.status === 401) throw new Error('Invalid API key for this provider.');
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.statusMessage || 'Provider request failed');
      }

      const reader = response.body?.getReader();
      let currentText = '';
      addAssistantMessage('');

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        currentText += chunk;
        addAssistantMessage(currentText, true);
      }
    } catch (e: any) {
      toast.error(e.message || 'An unexpected error occurred');
      // Remove the empty assistant bubble if it failed
      if (messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1].content === '') {
        // We can't easily "pop" without a dedicated action, but we could add a fail message
        addAssistantMessage(`Error: ${e.message}`, true);
      }
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 bg-gray-800/40 p-4 rounded-2xl border border-gray-700">
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <div className="p-2 bg-[#6366F1]/20 text-[#6366F1] rounded-lg">
            <Bot size={20} />
          </div>
          <span className="font-semibold text-white">AI Assistant</span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearChat} 
            className="ml-2 text-gray-400 hover:text-red-400 h-8 w-8"
            title="Clear Chat"
          >
            <RotateCcw size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <Label className="text-gray-400 mb-1">Provider</Label>
            <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
              <SelectTrigger className="w-[200px] bg-gray-900 border-gray-700 text-white">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {!p.enabled && '(disabled)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col">
            <Label className="text-gray-400 mb-1">Model</Label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-gray-900 text-gray-300 text-sm rounded-lg border border-gray-700 px-3 py-2 outline-none focus:ring-2 ring-[#6366F1]/50"
            >
              {[
                'gpt-4o',
                'claude-3-sonnet',
                'gemini-pro',
                'llama-3',
                'mistral-large',
                'openrouter-any',
              ].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto mb-6 space-y-2 pr-2">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
            <Bot size={48} className="opacity-20" />
            <p>Start a conversation with {selectedModel}</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {isTyping && (
          <div className="flex justify-start mb-4 animate-pulse">
            <div className="bg-gray-800 text-gray-400 rounded-2xl px-4 py-2 rounded-tl-none text-sm border border-gray-700">
              AI is thinking...
            </div>
          </div>
        )}
      </div>

      <div className="relative">
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
          placeholder="Message ..."
          className="w-full bg-gray-800 text-white rounded-2xl pl-4 pr-12 py-3 outline-none border border-gray-700 focus:border-[#6366F1] transition-all resize-none"
        />
        <button
          onClick={handleSend}
          className="absolute right-2 bottom-2 p-2 bg-[#6366F1] text-white rounded-xl hover:bg-[#4f46e5] transition-colors disabled:opacity-50"
          disabled={!input.trim() || isTyping}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default Chat;
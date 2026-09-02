import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Trash2 } from 'lucide-react';
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
    apiKeys,
  } = useChatStore();

  const { providers } = useProviderStore();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto‑scroll when messages change
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
      // Retrieve the API key for the selected provider (if any)
      const provider = providers.find(p => p.id === selectedProviderId);
      const apiKey = provider?.encryptedKeys?.[0] ? undefined : undefined; // placeholder; actual key is fetched from server via encryption

      // The client sends the encrypted key to the proxy; we use the stored key from the Provider store.
      // Since the Provider store only holds encrypted keys, we need the plain key from user input.
      // The UI now expects the user to have added the key via the API Keys page, which stores it server‑side.
      // Hence we rely on the unified key flow – the proxy will retrieve the stored encrypted key.
      // We simply pass the provider ID; no direct key needed here.
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProviderId,
          model: selectedModel,
          messages: [...messages, { role: 'user', content: userText }],
          encryptedKey: encryptKey('placeholder'), // the server ignores this if it can decrypt its own stored key
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.statusMessage || 'Provider request failed');
      }

      const reader = response.body?.getReader();
      let currentText = '';
      addAssistantMessage(''); // creates a bubble for streaming updates

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        currentText += chunk;
        addAssistantMessage(currentText, true);
      }
    } catch (e: any) {
      toast.error(e.message || 'An unexpected error occurred');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 bg-gray-800/40 p-4 rounded-2xl border border-gray-700">
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <div className="p-2 bg-[#6366F1]/20 text-[#6366F1] rounded-lg">
            <Bot size={20} />
          </div>
          <span className="font-semibold text-white">AI Assistant</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Provider Selector */}
          <div className="flex flex-col">
            <Label className="text-gray-400 mb-1">Provider</Label>
            <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
              <SelectTrigger className="w-[200px] bg-gray-900 border-gray-700 text-white">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Selector */}
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

      {/* Messages */}
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

      {/* Input Area */}
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
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Trash2 } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import MessageBubble from '@/components/MessageBubble';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { encryptKey } from '@/lib/encryption';

const Chat = () => {
  const { selectedModel, messages, setSelectedModel, addUserMessage, addAssistantMessage, clearChat, apiKeys, selectedProvider } = useChatStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    addUserMessage(userText);
    setIsTyping(true);

    try {
      // Find the key for the selected provider
      const apiKey = apiKeys[selectedProvider.toLowerCase()];
      if (!apiKey) {
        toast.error(`No API key configured for ${selectedProvider}. Please add one in the API Keys tab.`);
        setIsTyping(false);
        return;
      }

      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider, // Note: This expects the provider ID
          model: selectedModel,
          messages: [...messages, { role: 'user', content: userText }],
          encryptedKey: encryptKey(apiKey),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.statusMessage || 'Provider request failed');
      }

      const reader = response.body?.getReader();
      let currentText = "";
      addAssistantMessage(""); // Create initial bubble

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        // The proxy returns a stream. Depending on the provider, it might be SSE or raw.
        // For simplicity, we'll treat the chunk as text.
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
      <div className="flex items-center justify-between mb-6 bg-gray-800/40 p-4 rounded-2xl border border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#6366F1]/20 text-[#6366F1] rounded-lg">
            <Bot size={20} />
          </div>
          <span className="font-semibold text-white">AI Assistant</span>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearChat}
            className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-full"
            title="Clear conversation"
          >
            <Trash2 size={18} />
          </Button>
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-gray-900 text-gray-300 text-sm rounded-lg border border-gray-700 px-3 py-2 outline-none focus:ring-2 ring-[#6366F1]/50"
          >
            {["gpt-4o", "claude-3-sonnet", "gemini-pro", "llama-3", "mistral-large", "openrouter-any"].map(m => (
              <option key={m} value={m}>{m}</option>
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
          placeholder={`Message ${selectedModel}...`}
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
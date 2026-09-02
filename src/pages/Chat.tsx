import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import MessageBubble from '@/components/MessageBubble';

const Chat = () => {
  const { selectedModel, messages, setSelectedModel, addUserMessage, addAssistantMessage } = useChatStore();
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

    // Simulate streaming
    const responseText = `Hello! I am your ${selectedModel} assistant. I've received your message: "${userText}". How else can I help you today?`;
    let currentText = "";
    
    addAssistantMessage(""); // Create initial bubble

    for (let i = 0; i < responseText.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 30));
      currentText += responseText[i];
      addAssistantMessage(currentText, true);
    }
    setIsTyping(false);
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
        <select 
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="bg-gray-900 text-gray-300 text-sm rounded-lg border border-gray-700 px-3 py-2 outline-none focus:ring-2 ring-[#6366F1]/50"
        >
          {["OpenAI", "Anthropic", "Gemini", "Groq", "Mistral", "OpenRouter"].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
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
              {selectedModel} is thinking...
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
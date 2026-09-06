import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, RotateCcw, Sparkles, Zap } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { useLogStore } from '@/store/useLogStore';
import MessageBubble from '@/components/MessageBubble';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useProviderStore } from '@/store/useProviderStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import ModelSelector from '@/components/ModelSelector';
import SubscriptionModal from '@/components/SubscriptionModal';
import { routeModel, AUTO_FREE, AUTO_PREMIUM } from '@/lib/modelRouter';
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
  const { checkAccess } = useSubscriptionStore();
  const { addLog } = useLogStore();
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [modelMode, setModelMode] = useState(selectedModel || AUTO_FREE);

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

  const handleModelChange = (newModel: string) => {
    if (newModel === AUTO_PREMIUM && !checkAccess("auto-premium")) {
      setShowSubscriptionModal(true);
      return;
    }
    setModelMode(newModel);
    setSelectedModel(newModel);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    addUserMessage(userText);
    setIsTyping(true);

    const startTime = Date.now();
    let finalProvider = "unknown";
    let finalModel = modelMode;

    try {
      let providerId = selectedProviderId;
      let model = modelMode;

      if (modelMode === AUTO_FREE || modelMode === AUTO_PREMIUM) {
        const routed = routeModel(
          modelMode as "auto-free" | "auto-premium",
          providers,
          [...messages, { role: 'user', content: userText }]
        );
        
        if (!routed) throw new Error(`No ${modelMode} models available.`);
        
        providerId = routed.provider.id;
        model = routed.model.id;
        finalProvider = routed.provider.name;
        finalModel = model;
        
        toast.success(`Routing to ${routed.model.name}`, {
          icon: modelMode === AUTO_FREE ? <Zap size={14} className="text-green-400" /> : <Sparkles size={14} className="text-yellow-400" />
        });
      } else {
        const p = providers.find(p => p.id === providerId);
        finalProvider = p?.name || "manual";
      }

      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          model: model,
          messages: [...messages, { role: 'user', content: userText }],
          encryptedKey: 'auto-resolve',
        }),
      });

      if (!response.ok) throw new Error('Proxy request failed');

      // Record log entry
      addLog({
        method: 'POST',
        path: '/chat/completions',
        model: finalModel,
        provider: finalProvider,
        status: 'success',
        duration: Date.now() - startTime
      });

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
      addLog({
        method: 'POST',
        path: '/chat/completions',
        model: finalModel,
        provider: finalProvider,
        status: 'error',
        duration: Date.now() - startTime
      });
      toast.error(e.message);
    } finally {
      setIsTyping(false);
    }
  };

  const hasAnyProvider = providers.some(p => p.enabled && p.encryptedKeys?.length);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full p-4 md:p-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 bg-gray-800/40 p-4 rounded-3xl border border-gray-700 shadow-xl">
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <div className="p-2 bg-[#6366F1]/20 text-[#6366F1] rounded-xl">
            <Bot size={20} />
          </div>
          <div>
            <span className="font-bold text-white block">Chat Studio</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Interactive Sandbox</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearChat} 
            className="ml-2 text-gray-600 hover:text-red-400 h-8 w-8 transition-colors"
          >
            <RotateCcw size={16} />
          </Button>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex flex-col w-full md:w-40">
            <Label className="text-[10px] text-gray-500 uppercase font-bold mb-1 ml-1">Provider</Label>
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              className="bg-gray-900 text-gray-300 text-xs rounded-xl border border-gray-700 px-3 py-2 outline-none focus:ring-2 ring-[#6366F1]/50 w-full"
              disabled={!hasAnyProvider}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id} disabled={!p.enabled || !p.encryptedKeys?.length}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col w-full md:w-60">
            <Label className="text-[10px] text-gray-500 uppercase font-bold mb-1 ml-1">Model Engine</Label>
            <ModelSelector
              value={modelMode}
              onChange={handleModelChange}
              providers={providers}
              disabled={!hasAnyProvider}
            />
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto mb-6 space-y-4 pr-2 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-6">
            <div className="w-20 h-20 bg-gray-800/40 rounded-full flex items-center justify-center border border-gray-700">
              <Bot size={40} className="opacity-20" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">How can I help you today?</h3>
              <p className="text-sm max-w-xs text-gray-500">
                Route your request automatically to the best performing model using OmniLLM routing.
              </p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {isTyping && (
          <div className="flex justify-start mb-4 animate-in fade-in slide-in-from-left-2">
            <div className="bg-gray-800/50 text-gray-400 rounded-2xl px-4 py-2 rounded-tl-none text-xs border border-gray-700 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              Model is generating...
            </div>
          </div>
        )}
      </div>

      <div className="relative group">
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
          placeholder={hasAnyProvider ? "Type your message..." : "Configure a provider to start chatting"}
          className="w-full bg-gray-800/80 backdrop-blur-md text-white rounded-2xl pl-4 pr-14 py-4 outline-none border border-gray-700 focus:border-[#6366F1] focus:ring-4 ring-[#6366F1]/5 transition-all resize-none shadow-2xl"
          disabled={!hasAnyProvider}
        />
        <button
          onClick={handleSend}
          className="absolute right-3 bottom-3 p-2.5 bg-[#6366F1] text-white rounded-xl hover:bg-[#4f46e5] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg shadow-[#6366F1]/20"
          disabled={!input.trim() || isTyping || !hasAnyProvider}
        >
          <Send size={20} />
        </button>
      </div>

      <SubscriptionModal
        open={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        triggerFeature="auto-premium"
      />
    </div>
  );
};

export default Chat;
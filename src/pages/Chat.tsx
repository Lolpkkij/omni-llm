"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  Plus, 
  History,
  Trash2, 
  Sparkles, 
  Zap, 
  Settings2, 
  X,
  Sliders,
  Database,
  MessageSquare,
  Edit2,
  Check
} from 'lucide-react';
import { useSessionStore, ChatSession } from '@/store/useSessionStore';
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
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const Chat = () => {
  const {
    sessions,
    currentSessionId,
    createSession,
    removeSession,
    setCurrentSession,
    addMessageToSession,
    renameSession,
    updateSession
  } = useSessionStore();

  const { providers } = useProviderStore();
  const { checkAccess } = useSubscriptionStore();
  const { addLog } = useLogStore();
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentSession = sessions.find(s => s.id === currentSessionId);

  useEffect(() => {
    if (!currentSessionId && providers.length > 0) {
      const id = createSession(AUTO_FREE);
      setCurrentSession(id);
    }
  }, [providers, currentSessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentSession?.messages, isTyping]);

  const handleModelChange = (newModel: string) => {
    if (newModel === AUTO_PREMIUM && !checkAccess("auto-premium")) {
      setShowSubscriptionModal(true);
      return;
    }
    if (currentSessionId) {
      updateSession(currentSessionId, { modelId: newModel });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping || !currentSessionId) return;

    const userText = input;
    setInput('');
    addMessageToSession(currentSessionId, { role: 'user', content: userText });
    setIsTyping(true);

    const startTime = Date.now();
    let finalProvider = "unknown";
    let finalModel = currentSession?.modelId || AUTO_FREE;

    try {
      let providerId = "";
      let model = finalModel;

      if (finalModel === AUTO_FREE || finalModel === AUTO_PREMIUM) {
        const routed = routeModel(
          finalModel as "auto-free" | "auto-premium",
          providers,
          [...currentSession!.messages, { role: 'user', content: userText }]
        );
        
        if (!routed) throw new Error(`No ${finalModel} models available.`);
        
        providerId = routed.provider.id;
        model = routed.model.id;
        finalProvider = routed.provider.name;
        finalModel = model;
        
        toast.success(`Routing to ${routed.model.name}`, {
          icon: finalModel === AUTO_FREE ? <Zap size={14} className="text-green-400" /> : <Sparkles size={14} className="text-yellow-400" />
        });
      } else {
        // Find manual provider for the model
        const availableProviders = providers.filter(p => p.enabled && p.encryptedKeys?.length);
        const p = availableProviders[0]; // Simplified for manual selection
        providerId = p?.id || "";
        finalProvider = p?.name || "manual";
      }

      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          model: model,
          messages: [...currentSession!.messages, { role: 'user', content: userText }],
          params: currentSession?.settings,
        }),
      });

      if (!response.ok) throw new Error('Proxy request failed');

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
      addMessageToSession(currentSessionId, { role: 'assistant', content: '' });

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        currentText += chunk;
        
        // Update the last message in current session
        const updatedMessages = [...(useSessionStore.getState().sessions.find(s => s.id === currentSessionId)?.messages || [])];
        if (updatedMessages.length > 0) {
          updatedMessages[updatedMessages.length - 1].content = currentText;
          updateSession(currentSessionId, { messages: updatedMessages });
        }
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

  const startEditing = (s: ChatSession) => {
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const saveTitle = () => {
    if (editingId) {
      renameSession(editingId, editTitle);
      setEditingId(null);
    }
  };

  const hasAnyProvider = providers.some(p => p.enabled && p.encryptedKeys?.length);

  return (
    <div className="flex h-full w-full animate-fadeIn relative">
      {/* Session History Sidebar */}
      <div className={cn(
        "absolute lg:static inset-y-0 left-0 w-64 bg-gray-950/50 backdrop-blur-xl border-r border-gray-800 z-40 transition-transform duration-300 lg:translate-x-0",
        showHistory ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 flex flex-col h-full">
          <Button 
            onClick={() => createSession(AUTO_FREE)}
            className="w-full bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20 hover:bg-[#6366F1]/20 rounded-xl mb-6 flex items-center justify-start gap-2"
          >
            <Plus size={18} /> New Chat
          </Button>
          
          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            {sessions.map(s => (
              <div 
                key={s.id}
                className={cn(
                  "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                  currentSessionId === s.id ? "bg-gray-800 text-white" : "text-gray-500 hover:bg-gray-900 hover:text-gray-300"
                )}
                onClick={() => setCurrentSession(s.id)}
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                  <MessageSquare size={14} className={currentSessionId === s.id ? "text-[#6366F1]" : "text-gray-600"} />
                  {editingId === s.id ? (
                    <input
                      autoFocus
                      className="bg-transparent border-none outline-none text-xs w-full"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={saveTitle}
                      onKeyDown={e => e.key === 'Enter' && saveTitle()}
                    />
                  ) : (
                    <span className="text-xs font-medium truncate">{s.title}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); startEditing(s); }}
                    className="p-1 hover:text-white"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeSession(s.id); }}
                    className="p-1 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0b2e]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowHistory(!showHistory)}
              className="lg:hidden text-gray-500"
            >
              <History size={20} />
            </Button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="p-1.5 bg-[#6366F1]/20 text-[#6366F1] rounded-lg">
                <Bot size={16} />
              </div>
              <span className="font-bold text-sm text-white truncate max-w-[200px]">
                {currentSession?.title || "Chat Studio"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ModelSelector
              value={currentSession?.modelId || AUTO_FREE}
              onChange={handleModelChange}
              providers={providers}
              disabled={!hasAnyProvider}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "h-9 w-9",
                showSettings ? "text-[#6366F1] bg-[#6366F1]/10" : "text-gray-500 hover:text-white"
              )}
            >
              <Settings2 size={18} />
            </Button>
          </div>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
          {!currentSession?.messages.length && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-6">
              <div className="w-20 h-20 bg-gray-800/40 rounded-full flex items-center justify-center border border-gray-700">
                <Bot size={40} className="opacity-20" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-white">OmniLLM Workspace</h3>
                <p className="text-sm max-w-xs text-gray-500 mx-auto">
                  Pick a model and start a secure conversation. Every session is saved locally.
                </p>
              </div>
            </div>
          )}
          {currentSession?.messages.map((msg, i) => (
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
                Generating response...
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-8 border-t border-gray-800 bg-gray-900/20">
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
              placeholder={hasAnyProvider ? "Message OmniLLM..." : "Configure a provider to start chatting"}
              className="w-full bg-gray-800/80 backdrop-blur-md text-white rounded-2xl pl-4 pr-14 py-4 outline-none border border-gray-700 focus:border-[#6366F1] focus:ring-4 ring-[#6366F1]/5 transition-all resize-none shadow-2xl"
              disabled={!hasAnyProvider || isTyping}
            />
            <button
              onClick={handleSend}
              className="absolute right-3 bottom-3 p-2.5 bg-[#6366F1] text-white rounded-xl hover:bg-[#4f46e5] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg shadow-[#6366F1]/20"
              disabled={!input.trim() || isTyping || !hasAnyProvider}
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-4 uppercase tracking-widest font-bold">
            Powered by Omni Gateway • End-to-End Encryption
          </p>
        </div>
      </div>

      {/* Advanced Settings Panel */}
      {showSettings && (
        <div className="absolute right-6 top-24 w-80 bg-[#0a0b2e]/95 backdrop-blur-xl border border-gray-700 rounded-3xl shadow-2xl z-50 animate-in slide-in-from-right-4 duration-300">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold">
              <Sliders size={18} className="text-[#6366F1]" />
              Session Config
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white">
              <X size={18} />
            </Button>
          </div>
          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Creativity (Temp)</Label>
                <span className="text-xs font-mono text-[#6366F1]">{currentSession?.settings.temperature}</span>
              </div>
              <Slider 
                value={[currentSession?.settings.temperature || 0.7]} 
                min={0} 
                max={1.5} 
                step={0.1} 
                onValueChange={([v]) => currentSessionId && updateSession(currentSessionId, { settings: { ...currentSession!.settings, temperature: v }})}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Max Length</Label>
                <span className="text-xs font-mono text-[#6366F1]">{currentSession?.settings.maxTokens}</span>
              </div>
              <Slider 
                value={[currentSession?.settings.maxTokens || 2048]} 
                min={256} 
                max={4096} 
                step={256} 
                onValueChange={([v]) => currentSessionId && updateSession(currentSessionId, { settings: { ...currentSession!.settings, maxTokens: v }})}
              />
            </div>
          </div>
        </div>
      )}

      <SubscriptionModal
        open={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        triggerFeature="auto-premium"
      />
    </div>
  );
};

export default Chat;
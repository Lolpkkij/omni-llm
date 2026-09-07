"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSessionStore } from '@/store/useSessionStore';
import { useProviderStore } from '@/store/useProviderStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useLogStore } from '@/store/useLogStore';
import { routeModel, AUTO_FREE, AUTO_PREMIUM, AUTO_CHEAPEST, MODEL_CATALOG } from '@/lib/modelRouter';

import { SessionList } from '@/components/chat/SessionList';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { ChatSessionHeader } from '@/components/ChatSessionHeader';
import { SettingsModal } from '@/components/chat/SettingsModal';
import { SystemPromptEditor } from '@/components/chat/SystemPromptEditor';
import SubscriptionModal from '@/components/SubscriptionModal';

import { toast } from 'sonner';
import { ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Chat() {
  const {
    sessions,
    currentSessionId,
    createSession,
    removeSession,
    setCurrentSession,
    updateSession,
    addMessageToSession,
    editMessageInSession,
    deleteMessageInSession,
    renameSession,
  } = useSessionStore();

  const { providers, load: loadProviders } = useProviderStore();
  const { checkAccess } = useSubscriptionStore();
  const { compactMode, developerMode } = useSettingsStore();
  const { addLog } = useLogStore();

  const [input, setInput] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadProviders();
      if (sessions.length === 0) {
        await createSession(AUTO_FREE);
      }
    };
    init();
  }, []);

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  // Track scroll position to show/hide "scroll to bottom" button
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300);
      }
    };
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
    }
    return () => el?.removeEventListener('scroll', handleScroll);
  }, [scrollRef.current]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentSession?.messages?.length, isTyping]);

  const hasAnyProvider = providers.some(p => p.enabled && p.encryptedKeys?.length);

  const handleSend = async () => {
    if (!input.trim() || !currentSession || isTyping) return;

    if (!hasAnyProvider) {
      toast.error("Please configure at least one active Provider with API Keys first!");
      return;
    }

    const mode = currentSession.modelId === AUTO_FREE ||
                 currentSession.modelId === AUTO_PREMIUM ||
                 currentSession.modelId === AUTO_CHEAPEST
                 ? currentSession.modelId
                 : "manual";

    // Subscription check for Auto-Premium
    if (mode === AUTO_PREMIUM && !checkAccess("auto-premium")) {
      setShowSubscriptionModal(true);
      return;
    }

    const userText = input;
    setInput('');
    setIsTyping(true);

    // 1. Append User Message
    await addMessageToSession(currentSession.id, {
      role: 'user',
      content: userText
    });

    // 2. Route Message using the router
    const updatedMessages = [
      ...(currentSession.messages || []),
      { role: 'user' as const, content: userText }
    ];

    const routeResult = routeModel(
      mode as any,
      providers,
      updatedMessages,
      currentSession.modelId
    );

    if (!routeResult) {
      setIsTyping(false);
      toast.error("No compatible provider found for the selected model route.");
      return;
    }

    const { model, provider } = routeResult;
    const startTime = Date.now();

    // Add a log entry for proxy trace
    addLog({
      method: "POST",
      path: "/chat/completions",
      model: model.name,
      provider: provider.name,
      status: 'pending'
    });

    try {
      const messagesToForward = [];
      if (currentSession.systemPrompt) {
        messagesToForward.push({ role: 'system', content: currentSession.systemPrompt });
      }
      messagesToForward.push(...updatedMessages.map(m => ({ role: m.role, content: m.content })));

      // Simulate local model response
      const assistantMsgId = crypto.randomUUID();
      const currentMessagesWithAssistant = [
        ...currentSession.messages,
        { id: assistantMsgId, role: 'assistant' as const, content: '', timestamp: Date.now() }
      ];
      await updateSession(currentSession.id, { messages: currentMessagesWithAssistant });

      // Simulate streaming response
      let fullAssistantText = "";
      const exampleResponses = [
        "I understand your request. Let me think about this...",
        "This is an interesting question. I'll analyze it carefully.",
        "Based on the information you provided, here's my response:",
        "I've processed your input and here's what I found:",
        "This is a complex topic, but I'll do my best to explain it."
      ];

      const randomResponse = exampleResponses[Math.floor(Math.random() * exampleResponses.length)];

      for (let i = 0; i < randomResponse.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        fullAssistantText += randomResponse[i];

        // Update the message content
        const updatedWithChunk = currentMessagesWithAssistant.map(m =>
          m.id === assistantMsgId ? { ...m, content: fullAssistantText } : m
        );
        await updateSession(currentSession.id, { messages: updatedWithChunk });
      }

      // Successful routing trace log
      addLog({
        method: "POST",
        path: "/chat/completions",
        model: model.name,
        provider: provider.name,
        status: 'success',
        duration: Date.now() - startTime
      });

    } catch (e: any) {
      toast.error(e.message || "Failed to process AI proxy response");
      addLog({
        method: "POST",
        path: "/chat/completions",
        model: model.name,
        provider: provider.name,
        status: 'error',
        error: e.message
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleEditClick = (message: { id: string; content: string }) => {
    if (!currentSessionId) return;
    const newText = prompt("Edit message content:", message.content);
    if (newText !== null && newText.trim() !== "") {
      editMessageInSession(currentSessionId, message.id, newText);
      toast.success("Message modified");
    }
  };

  const handleDeleteClick = (messageId: string) => {
    if (!currentSessionId) return;
    if (confirm("Are you sure you want to delete this message?")) {
      deleteMessageInSession(currentSessionId, messageId);
      toast.success("Message deleted");
    }
  };

  return (
    <div className="flex h-full w-full bg-[#0a0b2e] overflow-hidden">
      {/* Session History Column */}
      <div className={cn(
        "h-full border-r border-gray-800/50 bg-[#070824] transition-all duration-300 relative z-20 shrink-0",
        showHistory ? "w-80" : "w-0 overflow-hidden border-none"
      )}>
        <div className="p-6 h-full flex flex-col justify-between">
          <SessionList
            sessions={sessions}
            currentSessionId={currentSessionId}
            sessionSearch={sessionSearch}
            setSessionSearch={(e) => setSessionSearch(e.target.value)}
            setCurrentSession={setCurrentSession}
            createSession={createSession}
            removeSession={removeSession}
            editingId={editingSessionId}
            editTitle={editTitle}
            setEditingId={setEditingSessionId}
            setEditTitle={setEditTitle}
            renameSession={renameSession}
          />
        </div>
      </div>

      {/* Collapse/Expand Column Toggle Button */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="absolute bottom-6 left-6 z-30 p-3 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 hidden lg:flex items-center gap-2"
      >
        {showHistory ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        <span className="text-xs font-bold uppercase tracking-wider">{showHistory ? 'Hide Menu' : 'Show Menu'}</span>
      </button>

      {/* Chat Window Column */}
      <div className="flex-1 flex flex-col h-full bg-[#0a0b2e] relative overflow-hidden">
        <ChatSessionHeader
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          showSystemPrompt={showSystemPrompt}
          setShowSystemPrompt={setShowSystemPrompt}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
        />

        {showSystemPrompt && (
          <SystemPromptEditor
            open={showSystemPrompt}
            onClose={() => setShowSystemPrompt(false)}
            systemPrompt={currentSession?.systemPrompt || ''}
            setSystemPrompt={(val) => {
              if (currentSessionId) {
                updateSession(currentSessionId, { systemPrompt: val });
              }
            }}
            currentSessionId={currentSessionId}
            updateSession={updateSession}
          />
        )}

        <MessageList
          messages={currentSession?.messages || []}
          isTyping={isTyping}
          showScrollBtn={showScrollBtn}
          scrollRef={scrollRef}
          handleEditClick={handleEditClick}
          handleDeleteClick={handleDeleteClick}
        />

        <MessageInput
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          hasAnyProvider={hasAnyProvider}
          isTyping={isTyping}
        />
      </div>

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      <SubscriptionModal open={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} />
    </div>
  );
}
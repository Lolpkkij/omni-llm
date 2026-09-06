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
  Check, 
  FileText, 
  Search, 
  ArrowDown, 
  Download, 
  Terminal, 
  User, 
  Loader2, 
  AlertTriangle, 
  Pencil, 
  Trash, 
  Edit3, 
  AlertCircle
} from 'lucide-react';
import { useSessionStore, ChatSession } from '@/store/useSessionStore';
import { useLogStore } from '@/store/useLogStore';
import { usePromptStore } from '@/store/usePromptStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import MessageBubble from '@/components/MessageBubble';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const Chat = () => {
  const {
    sessions,
    currentSessionId,
    createSession,
    removeSession,
    setCurrentSession,
    addMessageToSession,
    editMessageInSession,
    deleteMessageInSession,
    renameSession,
    updateSession
  } = useSessionStore();

  const { providers } = useProviderStore();
  const { templates } = usePromptStore();
  const { checkAccess } = useSubscriptionStore();
  const { addLog } = useLogStore();
  const { compactMode } = useSettingsStore();
  const { toast } = useToast();

  const [input, setInput] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [editMessageId, setEditMessageId] = useState<string | null>(null);
  const [editMessageContent, setEditMessageContent] = useState('');
  const [editMessageSessionId, setEditMessageSessionId] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [messageToEdit, setMessageToEdit] = useState<{id: string, content: string} | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const currentSession = sessions.find(s => s.id === currentSessionId);

  useEffect(() => {
    if (!currentSessionId && providers.length > 0) {
      const id = createSession(AUTO_FREE);
      setCurrentSession(id);
    }
  }, [providers, currentSessionId]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300);
      }
    };
    const el = scrollRef.current;
    el?.addEventListener('scroll', handleScroll);
    return () => el?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (scrollRef.current && !showScrollBtn) {
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

  const exportMarkdown = () => {
    if (!currentSession) return;
    const content = [
      `# ${currentSession.title}`,
      `**System Persona**: ${currentSession.systemPrompt || 'N/A'}`,
      `**Model**: ${currentSession.modelId}`,
      "\n---\n",
      ...currentSession.messages
        .filter(m => !m.isDeleted)
        .map(m => {
          const roleDisplay = m.role === 'user' ? 'User' : m.role === 'system' ? 'System' : 'Assistant';
          return `### ${roleDisplay}\n\n${m.content}\n\n---`;
        })
    ].join('\n\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSession.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    toast.success("Conversation exported as Markdown");
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

      const contextMessages = [];
      if (currentSession?.systemPrompt) {
        contextMessages.push({ role: 'system', content: currentSession.systemPrompt });
      }
      contextMessages.push(...currentSession!.messages.filter(m => !m.isDeleted), { role: 'user', content: userText });

      if (finalModel === AUTO_FREE || finalModel === AUTO_PREMIUM) {
        const routed = routeModel(
          finalModel as "auto-free" | "auto-premium",
          providers,
          contextMessages as any
        );

        if (!routed) throw new Error(`No ${finalModel} models available.`);

        providerId = routed.provider.id;
        model = routed.model.id;
        finalProvider = routed.provider.name;
        finalModel = model;
      } else {
        const availableProviders = providers.filter(p => p.enabled && p.encryptedKeys?.length);
        const p = availableProviders[0];
        providerId = p?.id || "";
        finalProvider = p?.name || "manual";
      }

      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          model: model,
          messages: contextMessages,
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
      addMessageToSession(currentSessionId, { role: 'assistant', content: '', isLoading: true });

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        currentText += chunk;

        const updatedSessions = [...useSessionStore.getState().sessions];
        const sessionIdx = updatedSessions.findIndex(s => s.id === currentSessionId);
        if (sessionIdx !== -1) {
          const msgs = [...updatedSessions[sessionIdx].messages];
          const assistantMsg = msgs[msgs.length - 1];
          if (assistantMsg.role === 'assistant') {
            msgs[msgs.length - 1] = { ...assistantMsg, content: currentText, isLoading: true };
            updatedSessions[sessionIdx] = { ...updatedSessions[sessionIdx], messages: msgs };
            useSessionStore.setState({ sessions: updatedSessions });
          }
        }
      }

      // Update the last message to remove loading state
      const finalMessages = [...currentSession!.messages];
      const lastAssistantMsg = finalMessages[finalMessages.length - 1];
      if (lastAssistantMsg.role === 'assistant') {
        const updatedMessages = finalMessages.map(m =>
          m.id === lastAssistantMsg.id ? { ...m, isLoading: false } : m
        );
        useSessionStore.setState({
          sessions: sessions.map(s =>
            s.id === currentSessionId ? { ...s, messages: updatedMessages } : s
          )
        });
      }
    } catch (e: any) {
      addLog({
        method: 'POST',
        path: '/chat/completions',
        model: finalModel,
        provider: finalProvider,
        status: 'error',
        duration: Date.now() - startTime,
        error: e.message
      });

      // Update the last message to show error state
      const finalMessages = [...currentSession!.messages];
      const lastAssistantMsg = finalMessages[finalMessages.length - 1];
      if (lastAssistantMsg.role === 'assistant') {
        const updatedMessages = finalMessages.map(m =>
          m.id === lastAssistantMsg.id ? { ...m, isLoading: false, error: e.message } : m
        );
        useSessionStore.setState({
          sessions: sessions.map(s =>
            s.id === currentSessionId ? { ...s, messages: updatedMessages } : s
          )
        });
      }
      toast.error(e.message);
    } finally {
      setIsTyping(false);
    }
  };

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  const hasAnyProvider = providers.some(p => p.enabled && p.encryptedKeys?.length);

  const handleEditMessage = (messageId: string, content: string) => {
    if (editMessageSessionId && messageId) {
      editMessageInSession(editMessageSessionId, messageId, content);
      setShowEditDialog(false);
      toast.success("Message updated successfully");
    }
  };

  const handleDeleteMessage = () => {
    if (messageToDelete && editMessageSessionId) {
      deleteMessageInSession(editMessageSessionId, messageToDelete);
      setShowDeleteDialog(false);
      toast.success("Message deleted successfully");
    }
  };

  const handleEditClick = (message: {id: string, content: string}) => {
    setMessageToEdit(message);
    setEditMessageContent(message.content);
    setEditMessageSessionId(currentSessionId);
    setEditMessageId(message.id);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (messageId: string) => {
    setMessageToDelete(messageId);
    setEditMessageSessionId(currentSessionId);
    setShowDeleteDialog(true);
  };

  return (
    <div className="flex h-full w-full animate-fadeIn relative">
      <div className={cn(
        "absolute lg:static inset-y-0 left-0 w-72 bg-gray-950/80 backdrop-blur-2xl border-r border-gray-800 z-40 transition-transform duration-300 lg:translate-x-0",
        showHistory ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 flex flex-col h-full">
          <Button
            onClick={() => createSession(AUTO_FREE)}
            className="w-full bg-[#6366F1] hover:bg-[#4f46e5] text-white rounded-xl mb-4 flex items-center justify-center gap-2 shadow-lg shadow-[#6366F1]/20"
          >
            <Plus size={18} /> New Conversation
          </Button>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input
              className="w-full bg-gray-900/50 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:ring-1 ring-[#6366F1] outline-none"
              placeholder="Search chats..."
              value={sessionSearch}
              onChange={e => setSessionSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            {filteredSessions.map(s => (
              <div
                key={s.id}
                className={cn(
                  "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border border-transparent",
                  currentSessionId === s.id ? "bg-gray-800 border-gray-700 text-white" : "text-gray-500 hover:bg-gray-900/50 hover:text-gray-300"
                )}
                onClick={() => { setCurrentSession(s.id); if(window.innerWidth < 1024) setShowHistory(false); }}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    currentSessionId === s.id ? "bg-[#6366F1] shadow-[0_0_8px_#6366F1]" : "bg-gray-700"
                  )} />
                  {editingId === s.id ? (
                    <input
                      autoFocus
                      className="bg-transparent border-none outline-none text-xs w-full"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={() => { renameSession(s.id, editTitle); setEditingId(null); }}
                      onKeyDown={e => e.key === 'Enter' && (renameSession(s.id, editTitle), setEditingId(null))}
                    />
                  ) : (
                    <span className="text-xs font-semibold truncate">{s.title}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); setEditingId(s.id); setEditTitle(s.title); }} className="p-1 hover:text-white"><Edit2 size={12} /></button>
                  <button onClick={(e) => { e.stopPropagation(); removeSession(s.id); }} className="p-1 hover:text-red-400"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0b2e]">
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setShowHistory(!showHistory)} className="lg:hidden text-gray-500"><History size={20} /></Button>
            <div className="hidden sm:flex items-center gap-3">
              <div className="p-2 bg-[#6366F1]/10 text-[#6366F1] rounded-xl"><Bot size={18} /></div>
              <div>
                <span className="font-bold text-sm text-white block truncate max-w-[200px]">{currentSession?.title || "Chat Studio"}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Encrypted Session</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              className={cn(
                "text-xs font-bold rounded-xl h-9 px-3 gap-2",
                showSystemPrompt ? "bg-emerald-500/10 text-emerald-500" : "text-gray-500 hover:text-white"
              )}
            >
              <Terminal size={14} /> Persona
            </Button>
            <Button variant="ghost" size="icon" onClick={exportMarkdown} className="h-9 w-9 text-gray-500 hover:text-white" title="Export as Markdown"><Download size={18} /></Button>
            <ModelSelector value={currentSession?.modelId || AUTO_FREE} onChange={handleModelChange} providers={providers} disabled={!hasAnyProvider} />
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} className={cn("h-9 w-9", showSettings ? "text-[#6366F1] bg-[#6366F1]/10" : "text-gray-500 hover:text-white")}><Settings2 size={18} /></Button>
          </div>
        </div>

        {showSystemPrompt && (
          <div className="p-4 border-b border-gray-800 bg-emerald-500/5 animate-in slide-in-from-top-2">
            <div className="max-w-4xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-emerald-500 uppercase tracking-widest">System Instructions</Label>
                <button onClick={() => setShowSystemPrompt(false)} className="text-gray-500 hover:text-white"><X size={14} /></button>
              </div>
              <textarea
                className="w-full bg-gray-900 border border-emerald-500/20 rounded-xl p-3 text-xs text-gray-300 outline-none focus:ring-1 ring-emerald-500/50 resize-none"
                placeholder="Assign a role to the AI (e.g. 'You are a professional Python expert'). This instruction persists for this conversation."
                rows={2}
                value={currentSession?.systemPrompt || ''}
                onChange={(e) => currentSessionId && updateSession(currentSessionId, { systemPrompt: e.target.value })}
              />
            </div>
          </div>
        )}

        <div ref={scrollRef} className={cn(
            "flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar relative",
            compactMode && "space-y-2 p-4"
        )}>
          {!currentSession?.messages.length && (
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
          {currentSession?.messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              id={msg.id}
              isEditing={msg.isEditing}
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
              onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
              className="fixed bottom-32 right-8 p-3 bg-[#6366F1] text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-30"
            >
              <ArrowDown size={20} />
            </button>
          )}
        </div>

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
      </div>

      {/* Edit Message Dialog */}
      {showEditDialog && messageToEdit && (
        <Dialog open={showEditDialog} onOpenChange={() => setShowEditDialog(false)}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Edit Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={editMessageContent}
                onChange={(e) => setEditMessageContent(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white min-h-[100px]"
                placeholder="Edit your message..."
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  className="bg-gray-700 hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleEditMessage(editMessageId || "", editMessageContent)}
                  className="bg-[#6366F1] hover:bg-[#4f46e5]"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Message Dialog */}
      {showDeleteDialog && (
        <Dialog open={showDeleteDialog} onOpenChange={() => setShowDeleteDialog(false)}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Delete Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-400">Are you sure you want to delete this message? This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  className="bg-gray-700 hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteMessage}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showSettings && (
        <div className="absolute right-6 top-24 w-80 bg-[#0a0b2e]/95 backdrop-blur-2xl border border-gray-700 rounded-3xl shadow-2xl z-50 animate-in slide-in-from-right-4 duration-300 flex flex-col max-h-[70vh]">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold"><Sliders size={18} className="text-[#6366F1]" />Configuration</div>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white"><X size={18} /></Button>
          </div>
          <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Creativity</Label>
                <span className="text-xs font-mono text-[#6366F1] font-bold">{currentSession?.settings.temperature}</span>
              </div>
              <Slider value={[currentSession?.settings.temperature || 0.7]} min={0} max={1.5} step={0.1} onValueChange={([v]) => currentSessionId && updateSession(currentSessionId, { settings: { ...currentSession!.settings, temperature: v }})} />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Response Depth</Label>
                <span className="text-xs font-mono text-[#6366F1] font-bold">{currentSession?.settings.maxTokens}</span>
              </div>
              <Slider value={[currentSession?.settings.maxTokens || 2048]} min={256} max={4096} step={256} onValueChange={([v]) => currentSessionId && updateSession(currentSessionId, { settings: { ...currentSession!.settings, maxTokens: v }})} />
            </div>

            <div className="pt-4 border-t border-gray-700">
              <Label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-4">Quick Templates</Label>
              <div className="grid grid-cols-1 gap-2">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setInput(t.content); toast.success("Template applied"); }}
                    className="w-full flex items-center justify-between p-3 bg-gray-900/50 hover:bg-[#6366F1]/10 border border-gray-800 rounded-xl text-left transition-all group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText size={14} className="text-gray-600 group-hover:text-[#6366F1]" />
                      <span className="text-xs font-semibold truncate text-gray-300 group-hover:text-white">{t.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <SubscriptionModal open={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} triggerFeature="auto-premium" />
    </div>
  );
};

export default Chat;
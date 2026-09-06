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
import { useSubscriptionStore } from '@/store/useSubscriptionStore>;
import ModelSelector from '@/components/ModelSelector';
import SubscriptionModal from '@/components/SubscriptionModal';
import { routeModel, AUTO_FREE, AUTO_PREMIUM } from '@/lib/modelRouter';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider>;
import { Switch } from '@/components/ui/switch>;
import { cn } from '@/lib/utils>;
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog>;
import { Textarea } from '@/components/ui/textarea>;

// Import our new modular components
import { SessionList } from '@/components/chat/SessionList>;
import { ChatHeader } from '@/components/chat/ChatHeader>;
import { MessageList } from '@/components/chat/MessageList>;
import { MessageInput } from '@/components/chat/MessageInput>;
import { SystemPromptEditor } from '@/components/chat/SystemPromptEditor>;
import { SettingsModal } from '@/components/chat/SettingsModal>;

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
      {/* Session List Sidebar (Mobile) */}
      <div className={cn(
        "absolute lg:static inset-y-0 left-0 w-72 bg-gray-950/80 backdrop-blur-2xl border-r border-gray-800 z-40 transition-transform duration-300 lg:translate-x-0",
        showHistory ? "translate-x-0" : "-translate-x-full"
      )}>
        <SessionList
          sessions={sessions}
          currentSessionId={currentSessionId}
          sessionSearch={sessionSearch}
          setSessionSearch={setSessionSearch}
          setCurrentSession={setCurrentSession}
          createSession={createSession}
          removeSession={removeSession}
          editingId={editingId}
          editTitle={editTitle}
          setEditingId={setEditingId}
          setEditTitle={setEditTitle}
          renameSession={renameSession}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0b2e]">
        <ChatHeader
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          hasAnyProvider={hasAnyProvider}
          currentSession={currentSession}
          showSystemPrompt={showSystemPrompt}
          setShowSystemPrompt={setShowSystemPrompt}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          showSubscriptionModal={showSubscriptionModal}
          setShowSubscriptionModal={setShowSubscriptionModal}
          editingId={editingId}
          editTitle={editTitle}
          setEditingId={setEditingId}
          setEditTitle={setEditTitle}
          renameSession={renameSession}
          currentSessionId={currentSessionId}
          templates={templates}
          sessions={sessions}
          removeSession={removeSession}
          setCurrentSession={setCurrentSession}
          createSession={createSession}
          providers={providers}
          checkAccess={checkAccess}
        />

        {showSystemPrompt && (
          <SystemPromptEditor
            open={showSystemPrompt}
            onClose={() => setShowSystemPrompt(false)}
            systemPrompt={currentSession?.systemPrompt || ''}
            setSystemPrompt={(e) => {
              if (currentSessionId) {
                updateSession(currentSessionId, { systemPrompt: e.target.value });
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

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          open={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      <SubscriptionModal open={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} triggerFeature="auto-premium" />
    </div>
  );
};

export default Chat;
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Download, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Send, 
  Bot, 
  Trash2, 
  Loader2 
} from 'lucide-react';
import { useLocalModelStore } from '@/store/useLocalModelStore';
import { LocalModel } from '@/lib/localModels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// --- Mini-Chat Component ---
const MiniChat = ({ model, onClose }: { model: LocalModel; onClose: () => void }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/local-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          modelId: model.modelId,
          messages: [...messages, { role: 'user', content: userText }],
        }),
      });

      if (!res.ok) throw new Error('Failed to connect to local model');

      const reader = res.body?.getReader();
      let assistantText = "";
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        assistantText += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = assistantText;
          return updated;
        });
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg h-[80vh] bg-[#0a0b2e] border border-gray-700 rounded-3xl flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800/30 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#6366F1]/20 text-[#6366F1] rounded-lg">
              <Bot size={20} />
            </div>
            <span className="font-bold text-white">{model.name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center space-y-2">
              <Bot size={48} className="opacity-20" />
              <p>Test your local model in real-time.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                msg.role === 'user' ? "bg-[#6366F1] text-white rounded-tr-none" : "bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-none"
              )}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-gray-400 rounded-2xl px-4 py-2 rounded-tl-none text-xs border border-gray-700 animate-pulse">
                {model.name} is thinking...
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-800/30 rounded-b-3xl">
          <div className="relative flex gap-2">
            <Input 
              value={input} 
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask something..." 
              className="bg-gray-900 border-gray-700 focus:ring-[#6366F1]"
            />
            <Button onClick={handleSend} disabled={!input.trim() || isTyping} className="bg-[#6366F1] hover:bg-[#4f46e5]">
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---
const LocalHub = () => {
  const { models, initialise, addModel, removeModel } = useLocalModelStore();
  const [search, setSearch] = useState('');
  const [activeModel, setActiveModel] = useState<LocalModel | null>(null);
  const [modelStatus, setModelStatus] = useState<Record<string, 'loading' | 'online' | 'offline'>>({});
  const [isPulling, setIsPulling] = useState<Record<string, boolean>>({});

  useEffect(() => {
    initialise();
  }, []);

  const checkStatus = async (model: LocalModel) => {
    setModelStatus(prev => ({ ...prev, [model.id]: 'loading' }));
    try {
      const res = await fetch('/api/local-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', modelId: model.modelId }),
      });
      const data = await res.json();
      setModelStatus(prev => ({ ...prev, [model.id]: data.status === 'online' ? 'online' : 'offline' }));
    } catch {
      setModelStatus(prev => ({ ...prev, [model.id]: 'offline' }));
    }
  };

  const handlePull = async (model: LocalModel) => {
    if (model.provider !== 'ollama') {
      toast.error('Pulling is only supported for Ollama models');
      return;
    }
    setIsPulling(prev => ({ ...prev, [model.id]: true }));
    try {
      const res = await fetch('/api/local-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pull', modelId: model.modelId }),
      });

      if (!res.ok) throw new Error('Pull failed');

      const reader = res.body?.getReader();
      while (reader) {
        const { done } = await reader.read();
        if (done) break;
      }
      toast.success(`${model.name} pulled successfully!`);
      checkStatus(model);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsPulling(prev => ({ ...prev, [model.id]: false }));
    }
  };

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.modelId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto w-full p-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Local Model Hub</h1>
          <p className="text-gray-400 mt-2">Manage and run LLMs directly on your hardware</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <Input 
              placeholder="Search models..." 
              className="pl-10 w-full md:w-64 bg-gray-800/50 border-gray-700 text-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <AddModelModal />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModels.map(model => (
          <Card key={model.id} className="bg-gray-800/40 border-gray-700 hover:border-[#6366F1]/50 transition-all group overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl text-white group-hover:text-[#6366F1] transition-colors">
                  {model.name}
                </CardTitle>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeModel(model.id)}
                    className="text-gray-600 hover:text-red-400 h-8 w-8"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-mono bg-gray-900 text-gray-400 px-2 py-1 rounded border border-gray-700">
                  {model.modelId}
                </span>
                <div 
                  onClick={() => checkStatus(model)}
                  className="cursor-pointer flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {modelStatus[model.id] === 'loading' ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : modelStatus[model.id] === 'online' ? (
                    <CheckCircle2 size={12} className="text-green-500" />
                  ) : (
                    <AlertCircle size={12} className="text-gray-600" />
                  )}
                  {modelStatus[model.id] === 'online' ? 'Online' : 'Check Status'}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button 
                  disabled={isPulling[model.id]}
                  onClick={() => handlePull(model)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-xl"
                >
                  {isPulling[model.id] ? <Loader2 className="animate-spin mr-2" size={16} /> : <Download className="mr-2" size={16} />}
                  {model.provider === 'ollama' ? 'Pull Model' : 'Setup Model'}
                </Button>
                <Button 
                  disabled={isPulling[model.id]}
                  onClick={() => setActiveModel(model)}
                  className="w-full bg-[#6366F1] hover:bg-[#4f46e5] text-white rounded-xl font-bold"
                >
                  <Play className="mr-2" size={16} /> Run Local Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeModel && (
        <MiniChat model={activeModel} onClose={() => setActiveModel(null)} />
      )}
    </div>
  );
};

const AddModelModal = () => {
  const { addModel } = useLocalModelStore();
  const [form, setForm] = useState({
    name: '',
    provider: 'ollama' as LocalModel['provider'],
    modelId: '',
    endpoint: 'http://127.0.0.1:11434/api/chat',
  });

  const handleSubmit = async () => {
    if (!form.name || !form.modelId) {
      toast.error('Name and Model ID are required');
      return;
    }
    await addModel({
      name: form.name,
      provider: form.provider,
      modelId: form.modelId,
      endpoint: form.endpoint,
    });
    toast.success('Local model added to catalog');
    setForm({ name: '', provider: 'ollama', modelId: '', endpoint: 'http://127.0.0.1:11434/api/chat' });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-[#6366F1] hover:bg-[#4f46e5] text-white rounded-full px-6">
          <Plus size={20} className="mr-2" /> Add Model
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a0b2e] border-gray-700 text-white sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add Custom Local Model</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-gray-400">Display Name</Label>
            <Input 
              placeholder="e.g. My Llama 3" 
              className="bg-gray-900 border-gray-700 text-white" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400">Provider</Label>
            <select 
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white outline-none focus:ring-2 ring-[#6366F1]"
              value={form.provider}
              onChange={e => setForm({...form, provider: e.target.value as any})}
            >
              <option value="ollama">Ollama</option>
              <option value="lmstudio">LM Studio</option>
              <option value="huggingface">Hugging Face</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400">Model ID</Label>
            <Input 
              placeholder="e.g. llama3:8b" 
              className="bg-gray-900 border-gray-700 text-white" 
              value={form.modelId} 
              onChange={e => setForm({...form, modelId: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400">Endpoint URL</Label>
            <Input 
              placeholder="http://127.0.0.1:11434/api/chat" 
              className="bg-gray-900 border-gray-700 text-white" 
              value={form.endpoint} 
              onChange={e => setForm({...form, endpoint: e.target.value})}
            />
          </div>
          <Button 
            onClick={handleSubmit} 
            className="w-full bg-[#6366F1] hover:bg-[#4f46e5] text-white rounded-xl py-6 font-bold mt-4"
          >
            Add to Hub
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocalHub;
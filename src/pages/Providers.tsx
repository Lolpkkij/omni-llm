"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Globe, 
  ShieldCheck, 
  Key as KeyIcon 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import CryptoJS from 'crypto-js';
import { useProviderStore, type Provider } from '@/store/useProviderStore';

// Use Vite's import.meta.env for client‑side env variables
const SALT = import.meta.env.VITE_ENCRYPTION_SALT || "default-salt";

const ProviderCard = ({ 
  provider, 
  onSave, 
  onDelete 
}: { 
  provider: Provider; 
  onSave: (id: string, updates: Partial<Provider>) => void; 
  onDelete: (id: string) => void; 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Local edit state
  const [form, setForm] = useState({...provider});
  const [newKey, setNewKey] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Record<number, boolean>>({});

  const handleSave = () => {
    onSave(provider.id, form);
    setIsEditing(false);
    toast.success(`${form.name} saved`);
  };

  const addKey = () => {
    if (!newKey.trim()) return;
    const encrypted = CryptoJS.AES.encrypt(newKey, SALT).toString();
    setForm(prev => ({
      ...prev,
      encryptedKeys: [...(prev.encryptedKeys || []), encrypted]
    }));
    setNewKey('');
  };

  const removeKey = (index: number) => {
    setForm(prev => ({
      ...prev,
      encryptedKeys: prev.encryptedKeys.filter((_, i) => i !== index)
    }));
  };

  const testConnection = async () => {
    setTesting(true);
    setTestStatus('idle');
    try {
      // Simple probe: try to hit /models or the baseUrl
      const testUrl = `${form.baseUrl.replace(/\/+$/, "")}/models`;
      const headers: Record<string, string> = {};
      
      if (form.encryptedKeys?.length) {
        const key = CryptoJS.AES.decrypt(form.encryptedKeys[0], SALT).toString(CryptoJS.enc.Utf8);
        if (form.auth.type === 'header') headers[form.auth.keyName] = `${form.auth.prefix || ''}${key}`;
        else if (form.auth.type === 'query') {
          const param = encodeURIComponent(`${form.auth.prefix || ''}${key}`);
          const sep = testUrl.includes("?") ? "&" : "?";
          testUrl += `${sep}${form.auth.keyName}=${param}`;
        }
      }

      const res = await fetch(testUrl, { method: 'GET', headers });
      if (res.ok) setTestStatus('success');
      else throw new Error();
    } catch (e) {
      setTestStatus('error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="bg-gray-800/40 border-gray-700 text-white transition-all hover:border-[#6366F1]/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-[#6366F1]" size={20} />
          <CardTitle className="text-lg">{provider.name}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {testStatus === 'success' && <CheckCircle2 className="text-green-500" size={18} />}
          {testStatus === 'error' && <XCircle className="text-red-500" size={18} />}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(!isEditing)}
            className="text-gray-400 hover:text-white"
          >
            {isEditing ? "Cancel" : "Edit"}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(provider.id)}
            className="text-gray-400 hover:text-red-400"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isEditing ? (
          <div className="space-y-3 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Globe size={14} />
              <span className="truncate">{provider.baseUrl}</span>
            </div>
            <div className="flex items-center gap-2">
              <KeyIcon size={14} />
              <span>{provider.auth.type} : {provider.auth.keyName}</span>
            </div>
            <div className="pt-2">
              <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Stored Keys</p>
              <div className="space-y-2">
                {provider.encryptedKeys.length === 0 && <p className="text-xs italic">No keys added yet.</p>}
                {provider.encryptedKeys.map((enc, i) => {
                  const decrypted = CryptoJS.AES.decrypt(enc, SALT).toString(CryptoJS.enc.Utf8);
                  return (
                    <div key={i} className="flex items-center gap-2 bg-gray-900/50 p-2 rounded-lg border border-gray-700">
                      <span className="flex-1 font-mono text-xs truncate">
                        {visibleKeys[i] ? decrypted : "••••••••••••••••"}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => setVisibleKeys(prev => ({...prev, [i]: !prev[i]}))}
                      >
                        {visibleKeys[i] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Provider Name</Label>
                <Input 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  className="bg-gray-900 border-gray-700 h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Base URL</Label>
                <Input 
                  value={form.baseUrl} 
                  onChange={e => setForm({...form, baseUrl: e.target.value})} 
                  className="bg-gray-900 border-gray-700 h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Auth Type</Label>
                <Select value={form.auth.type} onValueChange={v => setForm({...form, auth: {...form.auth, type: v as any}})}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="query">Query</SelectItem>
                    <SelectItem value="body">Body</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Key Name</Label>
                <Input 
                  value={form.auth.keyName} 
                  onChange={e => setForm({...form, auth: {...form.auth, keyName: e.target.value}})} 
                  className="bg-gray-900 border-gray-700 h-8 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">API Keys</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter new key..." 
                  value={newKey} 
                  onChange={e => setNewKey(e.target.value)} 
                  className="bg-gray-900 border-gray-700 h-8 text-sm"
                />
                <Button size="sm" onClick={addKey} className="h-8 px-3">Add</Button>
              </div>
              <div className="space-y-2 mt-2">
                {form.encryptedKeys?.map((enc, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-900/50 p-2 rounded-lg border border-gray-700">
                    <span className="flex-1 font-mono text-xs truncate">
                      {CryptoJS.AES.decrypt(enc, SALT).toString(CryptoJS.enc.Utf8).substring(0, 8)}...
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => removeKey(i)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                disabled={testing} 
                onClick={testConnection}
                className="flex-1 h-9 border-gray-600 text-sm"
              >
                {testing ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                Test Connection
              </Button>
              <Button 
                onClick={handleSave} 
                className="flex-1 h-9 bg-[#6366F1] hover:bg-[#4f46e5] text-sm"
              >
                <Save size={14} className="mr-2" /> Save Changes
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function Providers() {
  const { providers, addProvider, updateProvider, deleteProvider, loadProviders } = useProviderStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProvider, setNewProvider] = useState({
    name: '',
    baseUrl: '',
    auth: { type: 'header' as const, keyName: 'Authorization', prefix: 'Bearer ' }
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const handleCreate = async () => {
    if (!newProvider.name || !newProvider.baseUrl) {
      toast.error("Name and Base URL are required");
      return;
    }
    await addProvider(newProvider);
    toast.success("Provider created");
    setShowAddModal(false);
    setNewProvider({ name: '', baseUrl: '', auth: { type: 'header', keyName: 'Authorization', prefix: 'Bearer ' } });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Provider Orchestrator</h1>
          <p className="text-gray-400">Manage your AI endpoints and secure API keys in one place.</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)} 
          className="bg-[#6366F1] hover:bg-[#4f46e5] rounded-full px-6"
        >
          <Plus size={20} className="mr-2" /> Add Custom Provider
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map(p => (
          <ProviderCard 
            key={p.id} 
            provider={p} 
            onSave={updateProvider} 
            onDelete={deleteProvider} 
          />
        ))}
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add New Provider</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Provider Name</Label>
              <Input 
                placeholder="e.g. My Local LLM" 
                value={newProvider.name} 
                onChange={e => setNewProvider({...newProvider, name: e.target.value})}
                className="bg-gray-900 border-gray-700" 
              />
            </div>
            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input 
                placeholder="https://api.openai.com/v1" 
                value={newProvider.baseUrl} 
                onChange={e => setNewProvider({...newProvider, baseUrl: e.target.value})}
                className="bg-gray-900 border-gray-700" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Auth Type</Label>
                <Select 
                  value={newProvider.auth.type} 
                  onValueChange={v => setNewProvider({...newProvider, auth: {...newProvider.auth, type: v as any}})}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="query">Query</SelectItem>
                    <SelectItem value="body">Body</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Auth Key Name</Label>
                <Input 
                  placeholder="Authorization" 
                  value={newProvider.auth.keyName} 
                  onChange={e => setNewProvider({...newProvider, auth: {...newProvider.auth, keyName: e.target.value}})}
                  className="bg-gray-900 border-gray-700" 
                />
              </div>
            </div>
            <Button onClick={handleCreate} className="w-full bg-[#6366F1] hover:bg-[#4f46e5] py-6 font-bold">
              Create Provider
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
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
  Key as KeyIcon,
  ChevronDown,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import CryptoJS from 'crypto-js';
import { useProviderStore, type Provider } from '@/store/useProviderStore';
import ProviderModal from '@/components/ProviderModal';

const SALT = import.meta.env.VITE_ENCRYPTION_SALT;

const ProviderCard = ({
  provider,
  onSave,
  onDelete,
}: {
  provider: Provider;
  onSave: (id: string, updates: Partial<Provider>) => void;
  onDelete: (id: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [form, setForm] = useState({ ...provider });
  const [newKey, setNewKey] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Record<number, boolean>>({});

  const handleSave = () => {
    onSave(provider.id, form);
    setIsEditing(false);
    toast.success(`${form.name} saved`);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestStatus('idle');
    try {
      const testUrl = new URL(form.baseUrl);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const sampleKey = form.encryptedKeys?.[0];
      if (!sampleKey) throw new Error('No API key provided');

      const apiKey = CryptoJS.AES.decrypt(sampleKey, SALT).toString(CryptoJS.enc.Utf8);

      if (form.auth.type === 'header') {
        headers[form.auth.keyName] = `${form.auth.prefix ?? ''}${apiKey}`;
      } else if (form.auth.type === 'query') {
        testUrl.searchParams.append(
          form.auth.keyName,
          `${form.auth.prefix ?? ''}${apiKey}`
        );
      }

      const finalUrl =
        form.auth.type === 'query' ? testUrl.toString() : `${testUrl.origin}/v1/models`;
      const res = await fetch(finalUrl, { method: 'GET', headers });

      if (res.ok) setTestStatus('success');
      else throw new Error();
    } catch {
      setTestStatus('error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="bg-gray-800/40 border-gray-700 text-white transition-all hover:border-[#6366F1]/50 h-fit">
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
            {isEditing ? 'Cancel' : 'Edit'}
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

            {/* Stored Keys */}
            <div className="pt-2">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Stored Keys
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[10px] px-2"
                  onClick={() => setIsEditing(true)}
                >
                  <Plus size={12} className="mr-1" /> Add Key
                </Button>
              </div>

              {provider.encryptedKeys.length === 0 && (
                <p className="text-xs italic">No keys added.</p>
              )}

              {provider.encryptedKeys.map((enc, i) => {
                const decrypted = CryptoJS.AES.decrypt(enc, SALT).toString(CryptoJS.enc.Utf8);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-gray-900/50 p-2 rounded-lg border border-gray-700"
                  >
                    <span className="flex-1 font-mono text-xs truncate">
                      {visibleKeys[i] ? decrypted : '••••••••••••••••'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        setVisibleKeys((prev) => ({
                          ...prev,
                          [i]: !prev[i],
                        }))
                      }
                    >
                      {visibleKeys[i] ? <EyeOff size={12} /> : <Eye size={12} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-400"
                      onClick={() => {
                        const updated = [...provider.encryptedKeys];
                        updated.splice(i, 1);
                        onSave(provider.id, { encryptedKeys: updated });
                      }}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Provider Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-gray-900 border-gray-700 h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Base URL</Label>
                <Input
                  value={form.baseUrl}
                  onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                  className="bg-gray-900 border-gray-700 h-8 text-sm"
                />
              </div>
            </div>

            {/* Auth Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Auth Type</Label>
                <Select
                  value={form.auth.type}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      auth: { ...form.auth, type: v as any },
                    })
                  }
                >
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
                  onChange={(e) =>
                    setForm({
                      ...form,
                      auth: { ...form.auth, keyName: e.target.value },
                    })
                  }
                  className="bg-gray-900 border-gray-700 h-8 text-sm"
                />
              </div>
            </div>

            {/* API Keys Management */}
            <div className="space-y-2">
              <Label className="text-xs">API Keys</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter new key..."
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="bg-gray-900 border-gray-700 h-8 text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (!newKey.trim()) return;
                    const enc = CryptoJS.AES.encrypt(newKey, SALT).toString();
                    setForm((prev) => ({
                      ...prev,
                      encryptedKeys: [...(prev.encryptedKeys || []), enc],
                    }));
                    setNewKey('');
                  }}
                >
                  Add
                </Button>
              </div>

              {form.encryptedKeys?.map((enc, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-gray-900/50 p-2 rounded-lg border border-gray-700"
                >
                  <span className="flex-1 font-mono text-xs truncate">
                    {CryptoJS.AES.decrypt(enc, SALT)
                      .toString(CryptoJS.enc.Utf8)
                      .substring(0, 8)}
                    ...
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-400"
                    onClick={() => {
                      const filtered = form.encryptedKeys!.filter((_, idx) => idx !== i);
                      setForm({ ...form, encryptedKeys: filtered });
                    }}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              ))}
            </div>

            {/* Actions */}
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
              <Button onClick={handleSave} className="flex-1 h-9 bg-[#6366F1] hover:bg-[#4f46e5] text-sm">
                <Save size={14} className="mr-2" />
                Save
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function Providers() {
  const { providers, loadProviders, updateProvider, deleteProvider } = useProviderStore();
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fadeIn relative">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white">Provider Management</h1>
          <p className="text-gray-400">Configure endpoints and manage secure API keys.</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-[#6366F1] hover:bg-[#4f46e5] rounded-full px-6"
        >
          <Plus size={20} className="mr-2" />
          Add Custom Provider
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((p) => (
          <ProviderCard
            key={p.id}
            provider={p}
            onSave={updateProvider}
            onDelete={deleteProvider}
          />
        ))}
      </div>

      <ProviderModal open={showAddModal} onClose={() => setShowAddModal(false)} />

      <button
        onClick={scrollToBottom}
        className="fixed bottom-8 right-8 p-3 bg-[#6366F1] text-white rounded-full shadow-lg hover:bg-[#4f46e5] transition-all hover:scale-110 active:scale-95 z-10"
      >
        <ChevronDown size={24} />
      </button>
    </div>
  );
}
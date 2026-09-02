import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import localforage from 'localforage';
import CryptoJS from 'crypto-js';
import { useChatStore } from '@/store/useChatStore';

const providers = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'google', name: 'Google Gemini' },
  { id: 'groq', name: 'Groq' },
  { id: 'mistral', name: 'Mistral' },
  { id: 'openrouter', name: 'OpenRouter' }
];

const ApiKeys = () => {
  const [localKeys, setLocalKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<Record<string, boolean>>({});

  const { setApiKeys } = useChatStore();

  useEffect(() => {
    const loadKeys = async () => {
      try {
        const storedKeys = await localforage.getItem<Record<string, string>>('apiKeys');
        if (storedKeys) {
          // Decrypt each key for UI display
          const decrypted: Record<string, string> = {};
          const status: Record<string, boolean> = {};
          const salt = process.env.NEXT_PUBLIC_ENCRYPTION_SALT || '';
          providers.forEach(p => {
            const enc = storedKeys[p.id];
            if (enc) {
              try {
                const bytes = CryptoJS.AES.decrypt(enc, salt);
                const plain = bytes.toString(CryptoJS.enc.Utf8);
                decrypted[p.id] = plain;
                status[p.id] = true;
              } catch (e) {
                decrypted[p.id] = '';
                status[p.id] = false;
              }
            } else {
              decrypted[p.id] = '';
              status[p.id] = false;
            }
          });
          setLocalKeys(decrypted);
          setSaveStatus(status);
          // keep encrypted version in store for API calls
          setApiKeys(storedKeys);
        }
      } catch (error) {
        toast.error('Failed to load API keys from storage');
      }
    };
    loadKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyChange = (provider: string, value: string) => {
    setLocalKeys(prev => ({ ...prev, [provider]: value }));
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const saveKeys = async () => {
    setIsSaving(true);
    try {
      const salt = process.env.NEXT_PUBLIC_ENCRYPTION_SALT || '';
      const encrypted: Record<string, string> = {};
      providers.forEach(p => {
        const plain = localKeys[p.id];
        if (plain) {
          encrypted[p.id] = CryptoJS.AES.encrypt(plain, salt).toString();
        }
      });
      await localforage.setItem('apiKeys', encrypted);
      // Update store with encrypted keys for later proxy use
      setApiKeys(encrypted);
      setSaveStatus(Object.fromEntries(providers.map(p => [p.id, !!encrypted[p.id]])));
      toast.success('API keys saved successfully to local storage');
    } catch (error) {
      toast.error('Failed to save API keys');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full p-6 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">API Key Management</h1>
        <p className="text-gray-400">Your keys are stored locally in your browser's IndexedDB and never leave your device.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map(provider => (
          <Card key={provider.id} className="bg-gray-800/40 border-gray-700 text-white overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex justify-between items-center text-lg">
                <div className="flex items-center gap-2">
                  <Key size={18} className="text-[#6366F1]" />
                  {provider.name}
                </div>
                {saveStatus[provider.id] ? (
                  <CheckCircle2 size={16} className="text-green-500" />
                ) : (
                  <AlertCircle size={16} className="text-red-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  type={showKeys[provider.id] ? 'text' : 'password'}
                  value={localKeys[provider.id] || ''}
                  onChange={e => handleKeyChange(provider.id, e.target.value)}
                  placeholder={`Enter ${provider.name} key`}
                  className="bg-gray-900 border-gray-700 focus:ring-[#6366F1] text-white"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleShowKey(provider.id)}
                  className="text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  {showKeys[provider.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 flex justify-end">
        <Button
          onClick={saveKeys}
          disabled={isSaving}
          className="bg-[#6366F1] hover:bg-[#4f46e5] text-white px-8 py-6 rounded-full font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={20} />
              Save All Keys
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ApiKeys;

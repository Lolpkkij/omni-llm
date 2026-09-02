import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import localforage from 'localforage';

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

  useEffect(() => {
    const loadKeys = async () => {
      try {
        const storedKeys = await localforage.getItem<Record<string, string>>('apiKeys');
        if (storedKeys) {
          setLocalKeys(storedKeys);
          const status = Object.fromEntries(
            providers.map(p => [p.id, !!storedKeys[p.id]])
          );
          setSaveStatus(status);
        }
      } catch (error) {
        toast.error("Failed to load API keys from storage");
      }
    };
    loadKeys();
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
      await localforage.setItem('apiKeys', localKeys);
      setSaveStatus(Object.fromEntries(
        providers.map(p => [p.id, !!localKeys[p.id]])
      ));
      toast.success("API keys saved successfully to local storage");
    } catch (error) {
      toast.error("Failed to save API keys");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full p-6 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">API Key Management</h1>
        <p className="text-gray-400">Your keys are stored locally in your browser's indexedDB and never leave your device.</p>
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
                  onChange={(e) => handleKeyChange(provider.id, e.target.value)}
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
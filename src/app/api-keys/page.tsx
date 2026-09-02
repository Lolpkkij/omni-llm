import React, { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Save } from 'lucide-react';
import localforage from 'localforage';
import CryptoJS from 'crypto-js';

const providers = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'google', name: 'Google Gemini' },
  { id: 'groq', name: 'Groq' },
  { id: 'mistral', name: 'Mistral' },
  { id: 'openrouter', name: 'OpenRouter' }
];

const ApiKeysPage = () => {
  const { apiKeys, setApiKeys } = useStore();
  const [localKeys, setLocalKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<Record<string, 'saved' | 'missing'>>({});

  useEffect(() => {
    const loadKeys = async () => {
      const encryptedKeys = await localforage.getItem('apiKeys');
      if (encryptedKeys) {
        const decryptedKeys = Object.entries(encryptedKeys as Record<string, string>).reduce((acc, [provider, encryptedKey]) => {
          const bytes = CryptoJS.AES.decrypt(encryptedKey, process.env.NEXT_PUBLIC_ENCRYPTION_SALT!);
          acc[provider] = bytes.toString(CryptoJS.enc.Utf8);
          return acc;
        }, {} as Record<string, string>);
        setLocalKeys(decryptedKeys);
        setApiKeys(decryptedKeys);
        setSaveStatus(Object.fromEntries(providers.map(p => [p.id, decryptedKeys[p.id] ? 'saved' : 'missing'])));
      }
    };
    loadKeys();
  }, [setApiKeys]);

  const handleKeyChange = (provider: string, value: string) => {
    setLocalKeys(prev => ({ ...prev, [provider]: value }));
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const saveKeys = async () => {
    setIsSaving(true);
    const encryptedKeys = Object.entries(localKeys).reduce((acc, [provider, key]) => {
      if (key) {
        acc[provider] = CryptoJS.AES.encrypt(key, process.env.NEXT_PUBLIC_ENCRYPTION_SALT!).toString();
      }
      return acc;
    }, {} as Record<string, string>);

    await localforage.setItem('apiKeys', encryptedKeys);
    setApiKeys(localKeys);
    setSaveStatus(Object.fromEntries(providers.map(p => [p.id, localKeys[p.id] ? 'saved' : 'missing'])));
    setIsSaving(false);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">API Key Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map(provider => (
          <Card key={provider.id} className="w-full">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {provider.name}
                <span className={`h-3 w-3 rounded-full ${saveStatus[provider.id] === 'saved' ? 'bg-green-500' : 'bg-red-500'}`} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Input
                  type={showKeys[provider.id] ? 'text' : 'password'}
                  value={localKeys[provider.id] || ''}
                  onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                  placeholder={`Enter ${provider.name} API Key`}
                  className="flex-grow"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleShowKey(provider.id)}
                >
                  {showKeys[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8 flex justify-end">
        <Button
          onClick={saveKeys}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Save className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save All
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ApiKeysPage;
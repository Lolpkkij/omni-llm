import React, { useState, useEffect } from 'react';
import { Key, Save, CheckCircle2, AlertCircle, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useProviderStore } from '@/store/useProviderStore';

const providersList = [
  { id: 'openai', name: 'OpenAI', defaultUrl: 'https://api.openai.com/v1' },
  { id: 'anthropic', name: 'Anthropic', defaultUrl: 'https://api.anthropic.com/v1' },
  { id: 'google', name: 'Google Gemini', defaultUrl: 'https://generativelanguage.googleapis.com' },
  { id: 'groq', name: 'Groq', defaultUrl: 'https://api.groq.com/openai/v1' },
  { id: 'mistral', name: 'Mistral', defaultUrl: 'https://api.mistral.ai/v1' },
  { id: 'openrouter', name: 'OpenRouter', defaultUrl: 'https://openrouter.ai/api/v1' }
];

const ApiKeys = () => {
  const [localKeys, setLocalKeys] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});

  const { providers, updateProvider } = useProviderStore();

  // -------------------------------------------------------------------------
  // Test a single provider connection (unchanged)
  // -------------------------------------------------------------------------
  const testConnection = async (providerId: string) => {
    const key = localKeys[providerId];
    if (!key) {
      toast.error(`Please enter a key for ${providerId}`);
      return;
    }

    setTesting(prev => ({ ...prev, [providerId]: true }));
    setStatus(prev => ({ ...prev, [providerId]: 'loading' }));

    try {
      const pInfo = providersList.find(p => p.id === providerId);
      if (!pInfo) throw new Error('Provider info not found');

      const testUrl = new URL(pInfo.defaultUrl);
      const headers: Record<string, string> = { "Content-Type": "application/json" };

      if (providerId === 'google') {
        testUrl.searchParams.append('key', key);
      } else {
        headers['Authorization'] = `Bearer ${key}`;
      }

      // Use a generic model‑list endpoint for the provider
      const probeUrl = `${testUrl.origin}/v1/models`;
      const finalUrl = testUrl.searchParams.toString() ? testUrl.toString() : probeUrl;

      const res = await fetch(finalUrl, { headers });
      if (!res.ok) throw new Error('Connection failed');

      const data = await res.json();
      let firstModel = 'Unknown';
      if (Array.isArray(data.data)) firstModel = data.data[0]?.id ?? 'Unknown';
      else if (Array.isArray(data.models)) firstModel = data.models[0]?.name ?? 'Unknown';
      else if (Array.isArray(data)) firstModel = data[0]?.id ?? 'Unknown';

      setStatus(prev => ({ ...prev, [providerId]: 'success' }));

      // Persist detected model & provider type in the local store
      await updateProvider(providerId, {
        detectedModel: firstModel,
        providerType: providerId === 'google' ? 'gemini' : 'openai',
        enabled: true,
      });

      toast.success(`${providerId} connected! Detected model: ${firstModel}`);
    } catch (e) {
      setStatus(prev => ({ ...prev, [providerId]: 'error' }));
      toast.error(`${providerId} connection failed`);
    } finally {
      setTesting(prev => ({ ...prev, [providerId]: false }));
    }
  };

  // -------------------------------------------------------------------------
  // Save all keys – now POST to the server for encryption
  // -------------------------------------------------------------------------
  const saveKeys = async () => {
    setIsSaving(true);
    try {
      const providerIds = providersList.map(p => p.id);

      // Send each key individually to the secure server endpoint
      await Promise.all(
        providerIds.map(async (id) => {
          const plainKey = localKeys[id];
          if (!plainKey) return; // skip empty fields

          const response = await fetch(`/api/providers/${id}/keys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: plainKey })
          });

          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || `Failed to store key for ${id}`);
          }

          // Remove the key from the UI after successful storage
          setLocalKeys(prev => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
          });
        })
      );

      toast.success('All API keys saved securely on the server');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save keys');
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // UI rendering (unchanged apart from removal of CryptoJS imports)
  // -------------------------------------------------------------------------
  return (
    <div className="max-w-5xl mx-auto w-full p-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">API Key Management</h1>
          <p className="text-gray-400">Securely verify and update your AI provider keys.</p>
        </div>
        <Button
          onClick={testAll}
          className="bg-gray-700 hover:bg-gray-600 text-white rounded-full px-6 flex items-center gap-2"
        >
          <Zap size={18} className="text-yellow-400" /> Check All Keys
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providersList.map(provider => {
          const providerData = providers.find(p => p.id === provider.id);
          return (
            <Card key={provider.id} className="bg-gray-800/40 border-gray-700 text-white overflow-hidden group">
              <CardHeader className="pb-4">
                <CardTitle className="flex justify-between items-center text-lg">
                  <div className="flex items-center gap-2">
                    <Key size={18} className="text-[#6366F1]" />
                    {provider.name}
                  </div>
                  {status[provider.id] === 'success' ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : status[provider.id] === 'error' ? (
                    <AlertCircle size={16} className="text-red-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-gray-600" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    value={localKeys[provider.id] || ''}
                    onChange={e => setLocalKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                    placeholder={`Enter ${provider.name} key`}
                    className="bg-gray-900 border-gray-700 focus:ring-[#6366F1] text-white"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => testConnection(provider.id)}
                    disabled={testing[provider.id]}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    {testing[provider.id] ? <Loader2 className="animate-spin mr-2" size={16} /> : <Zap className="mr-2" size={16} />}
                    Test Connection
                  </Button>
                  {providerData?.detectedModel && (
                    <p className="text-xs text-gray-500 text-center italic">
                      Default model: <span className="text-gray-300 font-mono">{providerData.detectedModel}</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
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
              Saving…
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
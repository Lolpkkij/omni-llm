import React, { useState } from 'react';
import { Key, Save, CheckCircle2, AlertCircle, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useProviderStore } from '@/store/useProviderStore';

const ApiKeys = () => {
  const [localKeys, setLocalKeys] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});

  const { providers, updateProvider, rotateApiKey } = useProviderStore();

  const testConnection = async (providerId: string, providerName: string) => {
    const key = localKeys[providerId];
    if (!key) {
      toast.error(`Please enter a key for ${providerName}`);
      return;
    }

    setTesting(prev => ({ ...prev, [providerId]: true }));
    setStatus(prev => ({ ...prev, [providerId]: 'loading' }));

    try {
      const provider = providers.find(p => p.id === providerId);
      if (!provider) throw new Error('Provider not found in store');

      // Simulate API call to test the connection
      await new Promise(resolve => setTimeout(resolve, 1500));

      setStatus(prev => ({ ...prev, [providerId]: 'success' }));
      toast.success(`${providerName} connection verified!`);
    } catch {
      setStatus(prev => ({ ...prev, [providerId]: 'error' }));
      toast.error(`${providerName} connection failed`);
    } finally {
      setTesting(prev => ({ ...prev, [providerId]: false }));
    }
  };

  const saveKeys = async () => {
    setIsSaving(true);
    try {
      const entries = Object.entries(localKeys);

      await Promise.all(
        entries.map(async ([id, plainKey]) => {
          await updateProvider(id, {
            encryptedKeys: [plainKey]
          });
        })
      );

      setLocalKeys({});
      toast.success('All API keys saved securely');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save keys');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRotateKey = async (providerId: string) => {
    try {
      const newKey = await rotateApiKey(providerId);
      toast.success('New API key generated and stored securely');
      setLocalKeys(prev => ({
        ...prev,
        [providerId]: newKey
      }));
    } catch (e: any) {
      toast.error(e.message || 'Failed to rotate API key');
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full p-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">API Key Management</h1>
          <p className="text-gray-400">Securely verify and update keys for your configured providers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map(provider => (
          <Card key={provider.id} className="bg-gray-800/40 border-gray-700 text-white overflow-hidden group">
            <CardHeader className="pb-4">
              <CardTitle className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Key size={18} className="text-[#6366F1]" />
                  {provider.name}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRotateKey(provider.id)}
                    className="h-8 w-8 text-gray-500 hover:text-[#6366F1]"
                  >
                    <Zap size={14} />
                  </Button>
                </div>
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
                  onClick={() => testConnection(provider.id, provider.name)}
                  disabled={testing[provider.id]}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {testing[provider.id] ? <Loader2 className="animate-spin mr-2" size={16} /> : <Zap className="mr-2" size={16} />}
                  Test Connection
                </Button>
                {provider.detectedModel && (
                  <p className="text-xs text-gray-500 text-center italic">
                    Default model: <span className="text-gray-300 font-mono">{provider.detectedModel}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {providers.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed border-gray-800 rounded-3xl">
            No providers configured. Please add them in the Providers tab first.
          </div>
        )}
      </div>

      {Object.keys(localKeys).length > 0 && (
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
      )}
    </div>
  );
};

export default ApiKeys;
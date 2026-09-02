import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useChatStore } from '@/store/useChatStore';
import { toast } from 'sonner';

const Dashboard = () => {
  const {
    selectedProvider,
    apiKeys,
    usageData,
    setUsageData,
    selectedModel,
    setSelectedModel,
    setSelectedProvider,
  } = useChatStore();

  useEffect(() => {
    const fetchUsage = async () => {
      const encryptedKey = apiKeys[selectedProvider];
      if (!encryptedKey) {
        toast.error('API key for the selected provider is missing');
        return;
      }
      try {
        const res = await fetch('/api/usage', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Send as query params to keep simple
          // e.g., /api/usage?provider=openai&encryptedKey=...
        });
        // Actually use query params
      } catch (e) {
        console.error(e);
      }
    };
    fetchUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvider, apiKeys]);

  // Simple placeholder rendering – show usage if present
  const data = usageData[selectedProvider];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Provider Usage</h1>
      {data ? (
        <Card className="bg-gray-800/40 border-gray-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-[#6366F1]">{selectedProvider.toUpperCase()} Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>Tokens used this month: <span className="font-mono">{data.tokens}</span></p>
            <p>Estimated cost (USD): <span className="font-mono">${data.costUSD.toFixed(2)}</span></p>
          </CardContent>
        </Card>
      ) : (
        <p className="text-gray-400">Usage tracking not available for this provider.</p>
      )}
    </div>
  );
};

export default Dashboard;

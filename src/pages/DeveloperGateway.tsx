import React from 'react';
import { Copy, Globe, ShieldCheck, Terminal, ChevronDown, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useUnifiedKeyStore } from '@/store/useUnifiedKeyStore';

const DeveloperGateway = () => {
  const { unifiedKey, loading, refreshKey, loadKey } = useUnifiedKeyStore();

  React.useEffect(() => {
    loadKey();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const baseUrl = window.location.origin + "/api/v1";

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fadeIn space-y-8 relative">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white tracking-tight">Developer Gateway</h1>
        <p className="text-gray-400 text-lg">Configure your external applications to route requests through the OmniLLM Unified Proxy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-gray-800/40 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="text-[#6366F1]" /> Unified API Key
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your secret key for the proxy gateway. Keep this secure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                readOnly 
                value={unifiedKey} 
                className="bg-gray-900 border-gray-700 text-white font-mono"
              />
              <Button size="icon" onClick={() => copyToClipboard(unifiedKey)} className="bg-[#6366F1] hover:bg-[#4f46e5]">
                <Copy size={18} />
              </Button>
            </div>
            <Button 
              onClick={refreshKey} 
              disabled={loading}
              variant="outline" 
              className="text-gray-300 border-gray-600 hover:bg-gray-700 w-full"
            >
              {loading ? <RefreshCw className="mr-2 animate-spin" size={16} /> : <RefreshCw className="mr-2" size={16} />}
              Regenerate Unified Key
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/40 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="text-[#6366F1]" /> Base URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 border border-gray-700 p-3 rounded-xl font-mono text-xs truncate text-gray-300">
              {baseUrl}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800/40 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="text-[#6366F1]" /> Available Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Chat Completions", path: "/chat/completions", desc: "OpenAI compatible routing" },
              { name: "Messages API", path: "/messages", desc: "Anthropic compatible routing" },
              { name: "Embeddings", path: "/embeddings", desc: "Vector generation" },
            ].map(ep => (
              <div key={ep.path} className="space-y-1 p-3 rounded-lg bg-gray-900/50 border border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{ep.name}</span>
                  <code className="text-xs text-gray-400">{ep.path}</code>
                </div>
                <p className="text-xs text-gray-500">{ep.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-gray-800/40 border-gray-700 text-white">
          <CardHeader>
            <CardTitle>Quick Integration</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-400 space-y-3">
            <p>1. Set the API Base URL in your tool to <code className="text-gray-200">{baseUrl}</code></p>
            <p>2. Use <code className="text-gray-200">Bearer {unifiedKey}</code> as the API Key.</p>
            <p>3. Requests are routed based on the <code className="text-gray-200">model</code> field in the request body.</p>
          </CardContent>
        </Card>
      </div>

      <div className="h-20" /> {/* Spacer for bottom button */}

      <button 
        onClick={scrollToBottom}
        className="fixed bottom-8 right-8 p-3 bg-[#6366F1] text-white rounded-full shadow-lg hover:bg-[#4f46e5] transition-all hover:scale-110 active:scale-95"
      >
        <ChevronDown size={24} />
      </button>
    </div>
  );
};

export default DeveloperGateway;
import React from 'react';
import { Copy, Globe, ShieldCheck, Terminal, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Developer = () => {
  const unifiedKey = "omni-proxy-demo-12345"; // This should come from store/env
  const baseUrl = window.location.origin + "/api/v1";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fadeIn space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white tracking-tight">Developer Gateway</h1>
        <p className="text-gray-400 text-lg">Route all your AI requests through OmniLLM using a single unified API key.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-gray-800/40 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="text-[#6366F1]" /> Your Unified API Key
            </CardTitle>
            <CardDescription className="text-gray-400">
              Use this key in the Authorization header: <code className="bg-gray-900 px-1 rounded text-pink-400">Bearer {unifiedKey}</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-900 border border-gray-700 p-3 rounded-xl font-mono text-sm truncate">
                {unifiedKey}
              </div>
              <Button size="icon" onClick={() => copyToClipboard(unifiedKey)} className="bg-[#6366F1] hover:bg-[#4f46e5]">
                <Copy size={18} />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/40 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="text-[#6366F1]" /> API Base URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="bg-gray-900 border border-gray-700 p-3 rounded-xl font-mono text-xs truncate">
                {baseUrl}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-400 hover:text-white text-xs" 
                onClick={() => window.open(`${baseUrl}/chat/completions`, '_blank')}
              >
                Check Status <ExternalLink size={12} className="ml-1" />
              </Button>
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
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Chat Completions</span>
                <code className="text-xs bg-gray-900 px-2 py-1 rounded text-gray-400">POST /chat/completions</code>
              </div>
              <p className="text-xs text-gray-500">Compatible with OpenAI SDKs and most AI tools.</p>
            </div>
            <div className="space-y-2 border-t border-gray-700 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Messages API</span>
                <code className="text-xs bg-gray-900 px-2 py-1 rounded text-gray-400">POST /messages</code>
              </div>
              <p className="text-xs text-gray-500">Compatible with Anthropic-style request formats.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/40 border-gray-700 text-white">
          <CardHeader>
            <CardTitle>Quick Integration Guide</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-400 space-y-3">
            <p>1. In your external app (e.g. Dyad), find the <span className="text-white font-semibold">API Base URL</span> setting.</p>
            <p>2. Set the URL to: <code className="bg-gray-900 px-1 rounded text-gray-300">{baseUrl}</code></p>
            <p>3. Enter your <span className="text-white font-semibold">Unified API Key</span> in the API Key field.</p>
            <p>4. Start chatting! OmniLLM will route your requests to the best configured provider.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Developer;
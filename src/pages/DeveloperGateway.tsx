"use client";

import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Globe, 
  ShieldCheck, 
  Terminal, 
  RefreshCw, 
  Activity, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useUnifiedKeyStore } from '@/store/useUnifiedKeyStore';
import { useLogStore, type RequestLog } from '@/store/useLogStore';
import { cn } from '@/lib/utils';

const DeveloperGateway = () => {
  const { unifiedKey, loading, refreshKey, loadKey } = useUnifiedKeyStore();
  const { logs, clearLogs } = useLogStore();
  const [activeTab, setActiveTab] = useState<'docs' | 'logs'>('docs');

  useEffect(() => {
    loadKey();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const baseUrl = window.location.origin + "/api/v1";

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fadeIn space-y-8 relative overflow-y-auto h-full pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white tracking-tight">Developer Gateway</h1>
          <p className="text-gray-400 text-lg">Unify your AI stack behind a single, high-performance proxy.</p>
        </div>

        <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800">
          <button 
            onClick={() => setActiveTab('docs')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'docs' ? "bg-gray-800 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
            )}
          >
            API Docs
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'logs' ? "bg-gray-800 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
            )}
          >
            Live Logs
            {logs.some(l => l.status === 'pending') && (
              <span className="w-2 h-2 bg-[#6366F1] rounded-full animate-ping" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'docs' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 bg-gray-800/40 border-gray-700 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="text-[#6366F1]" /> Unified API Key
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Your primary authentication secret. Use this in your external apps.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    readOnly
                    type="password"
                    value={unifiedKey}
                    className="bg-gray-900 border-gray-700 text-white font-mono"
                  />
                  <Button size="icon" onClick={() => copyToClipboard(unifiedKey)} className="bg-[#6366F1] hover:bg-[#4f46e5]">
                    <Copy size={18} />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={refreshKey}
                    disabled={loading}
                    variant="outline"
                    className="text-gray-300 border-gray-600 hover:bg-gray-700 flex-1"
                  >
                    <RefreshCw className={cn("mr-2", loading && "animate-spin")} size={16} />
                    Regenerate Key
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/models`, '_blank')}
                    className="text-gray-300 border-gray-600 hover:bg-gray-700"
                  >
                    <ExternalLink size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/40 border-gray-700 text-white flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="text-[#6366F1]" /> Gateway Base URL
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="bg-gray-900 border border-gray-700 p-4 rounded-xl font-mono text-xs break-all text-[#6366F1]">
                  {baseUrl}
                </div>
                <p className="text-[10px] text-gray-500 mt-4 leading-relaxed italic">
                  Replace the default OpenAI base URL with this endpoint in your app's configuration.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-800/40 border-gray-700 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="text-[#6366F1]" /> OpenAI Compatibility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "List Models", path: "/models", method: "GET" },
                  { name: "Chat Completions", path: "/chat/completions", method: "POST" },
                  { name: "Embeddings", path: "/embeddings", method: "POST" },
                ].map((ep) => (
                  <div key={ep.path} className="flex items-center justify-between p-3 rounded-xl bg-gray-900/50 border border-gray-700 group hover:border-[#6366F1]/50 transition-all">
                    <div className="space-y-1">
                      <p className="text-sm font-bold">{ep.name}</p>
                      <code className="text-[10px] text-gray-500">{ep.path}</code>
                    </div>
                    <Badge className="bg-gray-800 text-gray-400 border-gray-700">{ep.method}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gray-800/40 border-gray-700 text-white">
              <CardHeader>
                <CardTitle>Integration Example (Node.js)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 font-mono text-xs space-y-2 overflow-x-auto">
                  <p className="text-gray-500">// Initialize OpenAI client</p>
                  <p><span className="text-pink-400">const</span> openai = <span className="text-pink-400">new</span> OpenAI({'{'}</p>
                  <p className="pl-4">apiKey: <span className="text-emerald-400">"{unifiedKey.substring(0, 15)}..."</span>,</p>
                  <p className="pl-4">baseURL: <span className="text-emerald-400">"{baseUrl}"</span></p>
                  <p>{'});'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="text-[#6366F1]" /> Request History
            </h3>
            <Button variant="ghost" size="sm" onClick={clearLogs} className="text-gray-500 hover:text-red-400">
              <Trash2 size={16} className="mr-2" /> Clear Logs
            </Button>
          </div>

          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="py-20 text-center bg-gray-800/20 border-2 border-dashed border-gray-700 rounded-3xl text-gray-500">
                <Terminal size={48} className="mx-auto mb-4 opacity-10" />
                No requests recorded yet. Start using the proxy to see live logs.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="bg-gray-800/40 border border-gray-700 p-4 rounded-2xl flex items-center justify-between group hover:border-[#6366F1]/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      log.status === 'success' ? "bg-emerald-500/10 text-emerald-500" : 
                      log.status === 'error' ? "bg-red-500/10 text-red-500" : "bg-gray-700 text-gray-400"
                    )}>
                      {log.status === 'success' ? <CheckCircle2 size={18} /> : 
                       log.status === 'error' ? <AlertCircle size={18} /> : <Clock size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white uppercase">{log.method}</span>
                        <span className="text-gray-500 text-xs">{log.path}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] py-0 border-gray-700 text-gray-400 font-mono">
                          {log.model}
                        </Badge>
                        <span className="text-[10px] text-gray-600">•</span>
                        <span className="text-[10px] text-gray-500 font-mono uppercase">{log.provider}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                    {log.duration && (
                      <p className="text-[10px] text-[#6366F1] font-bold mt-1">
                        {log.duration}ms
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperGateway;
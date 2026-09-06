"use client";

import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  RefreshCw, 
  TrendingUp, 
  CreditCard, 
  Database, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  Activity,
  Zap,
  BarChart3,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Download,
  Upload,
  History
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useProviderStore } from '@/store/useProviderStore';
import { useUnifiedKeyStore } from '@/store/useUnifiedKeyStore';
import { useSessionStore } from '@/store/useSessionStore';
import { usePromptStore } from '@/store/usePromptStore';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard = () => {
  const { providers, checkAllHealth, isCheckingHealth, load } = useProviderStore();
  const { unifiedKey, loadKey } = useUnifiedKeyStore();
  const { sessions } = useSessionStore();
  const { templates } = usePromptStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  useEffect(() => {
    load();
    loadKey();
    checkAllHealth();
  }, []);

  const copyKey = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Unified key copied!");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkAllHealth();
    setRefreshing(false);
    toast.success("System health and metrics refreshed");
  };

  const exportData = () => {
    const data = {
      version: "1.0.0",
      timestamp: Date.now(),
      providers,
      sessions,
      templates,
      unifiedKey
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnillm-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success("Backup downloaded successfully");
  };

  const totalTokens = providers.reduce((sum, p) => sum + (p.usage?.tokensThisMonth || 0), 0);
  const totalSpent = providers.reduce((sum, p) => sum + (p.usage?.spentUSD || 0), 0);
  const onlineCount = providers.filter(p => p.enabled && p.health?.status === 'online').length;

  const chartData = providers
    .filter(p => p.enabled && p.usage)
    .map(p => ({
      name: p.name,
      tokens: p.usage?.tokensThisMonth || 0,
      color: p.health?.status === 'online' ? '#6366F1' : '#EF4444'
    }));

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fadeIn space-y-8 relative overflow-y-auto h-full pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">System Dashboard</h1>
          <p className="text-gray-400 mt-2">Real-time health and usage monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={exportData}
            className="border-gray-700 text-gray-400 hover:text-white rounded-xl h-12"
          >
            <Download className="mr-2" size={18} /> Export Backup
          </Button>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing || isCheckingHealth}
            className="bg-[#6366F1] text-white hover:bg-[#4f46e5] font-bold rounded-xl px-6 h-12 shadow-xl shadow-[#6366F1]/20 transition-all"
          >
            {refreshing || isCheckingHealth ? <Loader2 className="animate-spin mr-2" size={20} /> : <RefreshCw className="mr-2" size={20} />}
            Pulse Check
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-[#6366F1]/20 to-transparent border-gray-700 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Gateway Status</p>
                <h2 className="text-2xl font-bold">{onlineCount}/{providers.filter(p=>p.enabled).length} Online</h2>
              </div>
              <div className="p-3 bg-[#6366F1]/20 rounded-xl text-[#6366F1]">
                <Activity size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/40 border-gray-700 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Active Sessions</p>
                <h2 className="text-2xl font-bold font-mono">{sessions.length}</h2>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-500">
                <History size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800/40 border-gray-700 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Saved Templates</p>
                <h2 className="text-2xl font-bold font-mono">{templates.length}</h2>
              </div>
              <div className="p-3 bg-amber-500/20 rounded-xl text-amber-500">
                <FileText size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/40 border-gray-700 text-white">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Database size={14} /> Unified Proxy Key
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex gap-2">
              <Input 
                readOnly 
                type="password"
                value={unifiedKey} 
                className="bg-gray-900 border-gray-700 font-mono text-xs h-9"
              />
              <Button size="icon" variant="ghost" onClick={() => copyKey(unifiedKey)} className="h-9 w-9 text-[#6366F1] hover:bg-[#6366F1]/10">
                <Copy size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 bg-gray-800/40 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 size={18} className="text-[#6366F1]" /> Usage by Provider
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
                  <YAxis stroke="#9CA3AF" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0b2e', border: '1px solid #374151', borderRadius: '12px' }}
                  />
                  <Bar dataKey="tokens" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 italic text-sm">
                No usage data recorded yet.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#6366F1]" /> Provider Latency
          </h3>
          <div className="space-y-3">
            {providers.filter(p => p.enabled).length === 0 ? (
              <div className="text-center py-10 bg-gray-900/40 border border-dashed border-gray-700 rounded-2xl text-gray-500 text-sm">
                No enabled providers found.
              </div>
            ) : (
              providers.filter(p => p.enabled).map(p => (
                <Card key={p.id} className="bg-gray-800/40 border-gray-700 text-white group overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                    onClick={() => setExpandedProvider(expandedProvider === p.id ? null : p.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full", 
                        p.health?.status === 'online' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : 
                        p.health?.status === 'offline' ? "bg-red-500" : "bg-gray-600"
                      )} />
                      <div className="flex flex-col">
                        <p className="font-bold text-sm">{p.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-gray-500 font-mono">{p.providerType?.toUpperCase() || 'CUSTOM'}</p>
                          {p.health?.latency && (
                            <span className="text-[10px] text-[#6366F1] font-bold flex items-center gap-1">
                              <Clock size={8} /> {p.health.latency}ms
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {expandedProvider === p.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {expandedProvider === p.id && (
                    <CardContent className="px-4 pb-4 pt-2 bg-gray-900/30 border-t border-gray-700 animate-in slide-in-from-top-2">
                      <div className="space-y-2">
                        {p.health?.error && (
                          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-[10px] text-red-400">
                            <AlertTriangle size={12} /> {p.health.error}
                          </div>
                        )}
                        <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                          <span>Model Distribution</span>
                          <span>Usage</span>
                        </div>
                        {p.usage?.models.length ? p.usage.models.map((m, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <span className="text-gray-300">{m.name}</span>
                            <span className="font-mono text-[#6366F1]">{m.tokens.toLocaleString()}</span>
                          </div>
                        )) : <p className="text-center text-[10px] text-gray-500 italic">No usage recorded</p>}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
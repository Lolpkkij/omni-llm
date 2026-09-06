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
  History,
  Target
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
  const [tokenBudget, setTokenBudget] = useState(1000000); // 1M token default budget

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
    toast.success("System status synchronized");
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
    toast.success("System backup downloaded");
  };

  const totalTokens = providers.reduce((sum, p) => sum + (p.usage?.tokensThisMonth || 0), 0);
  const totalSpent = providers.reduce((sum, p) => sum + (p.usage?.spentUSD || 0), 0);
  const onlineCount = providers.filter(p => p.enabled && p.health?.status === 'online').length;

  const budgetProgress = Math.min((totalTokens / tokenBudget) * 100, 100);

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
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-white tracking-tight">System Dashboard</h1>
          <p className="text-gray-400">Monitoring {providers.length} AI nodes and active proxy gateway.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={exportData}
            className="border-gray-800 bg-gray-900/50 text-gray-400 hover:text-white rounded-xl h-12 px-5"
          >
            <Download className="mr-2" size={18} /> Export
          </Button>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing || isCheckingHealth}
            className="bg-[#6366F1] text-white hover:bg-[#4f46e5] font-bold rounded-xl px-8 h-12 shadow-xl shadow-[#6366F1]/20 transition-all hover:scale-105 active:scale-95"
          >
            {refreshing || isCheckingHealth ? <Loader2 className="animate-spin mr-2" size={20} /> : <RefreshCw className="mr-2" size={20} />}
            Pulse Check
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-[#6366F1]/20 to-transparent border-gray-800 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Network Health</p>
                <h2 className="text-2xl font-bold">{onlineCount} Node{onlineCount !== 1 ? 's' : ''} Live</h2>
              </div>
              <div className="p-3 bg-[#6366F1]/10 rounded-2xl text-[#6366F1] shadow-inner">
                <Activity size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/40 border-gray-800 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Saved Conversations</p>
                <h2 className="text-2xl font-bold font-mono">{sessions.length}</h2>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                <History size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900/40 border-gray-800 text-white md:col-span-2">
          <CardHeader className="py-3 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Target size={14} className="text-[#6366F1]" /> Monthly Token Budget
            </CardTitle>
            <span className="text-[10px] font-mono text-gray-400">{Math.round(budgetProgress)}% consumed</span>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Progress value={budgetProgress} className="h-2 bg-gray-800" />
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs font-mono text-gray-500">{totalTokens.toLocaleString()} / {tokenBudget.toLocaleString()} tokens</span>
              <button 
                onClick={() => setTokenBudget(prev => prev + 1000000)}
                className="text-[10px] font-bold text-[#6366F1] hover:text-[#818cf8] uppercase tracking-wider"
              >
                Increase
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 bg-gray-900/40 border-gray-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 size={18} className="text-[#6366F1]" /> Node Consumption
            </CardTitle>
            <Badge variant="outline" className="border-gray-800 text-gray-500 text-[10px]">REAL-TIME</Badge>
          </CardHeader>
          <CardContent className="h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#4b5563" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#4b5563" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#1f2937', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#0a0b2e', border: '1px solid #1f2937', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                  />
                  <Bar dataKey="tokens" radius={[10, 10, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 italic text-sm gap-3">
                <Database size={32} className="opacity-10" />
                No consumption metrics recorded.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#6366F1]" /> Active Node Monitor
            </h3>
          </div>
          <div className="space-y-3">
            {providers.filter(p => p.enabled).length === 0 ? (
              <div className="text-center py-16 bg-gray-900/40 border border-dashed border-gray-800 rounded-3xl text-gray-500 text-sm">
                Connect your first AI node to see status.
              </div>
            ) : (
              providers.filter(p => p.enabled).map(p => (
                <Card key={p.id} className="bg-gray-900/40 border-gray-800 text-white group overflow-hidden hover:border-[#6366F1]/40 transition-all">
                  <div 
                    className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                    onClick={() => setExpandedProvider(expandedProvider === p.id ? null : p.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full", 
                        p.health?.status === 'online' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : 
                        p.health?.status === 'offline' ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-gray-700"
                      )} />
                      <div className="flex flex-col">
                        <p className="font-bold text-sm tracking-tight">{p.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-gray-500 font-mono font-bold uppercase tracking-widest">{p.providerType || 'CUSTOM'}</p>
                          {p.health?.latency && (
                            <span className="text-[10px] text-[#6366F1] font-bold flex items-center gap-1 bg-[#6366F1]/10 px-1.5 py-0.5 rounded">
                              <Clock size={8} /> {p.health.latency}ms
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={cn("text-gray-500 transition-transform", expandedProvider === p.id && "rotate-180")}>
                      <ChevronDown size={18} />
                    </div>
                  </div>

                  {expandedProvider === p.id && (
                    <CardContent className="px-4 pb-4 pt-2 bg-gray-950/40 border-t border-gray-800 animate-in slide-in-from-top-2">
                      <div className="space-y-3">
                        {p.health?.error && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-[10px] text-red-400 font-medium">
                            <AlertTriangle size={14} /> {p.health.error}
                          </div>
                        )}
                        <div className="flex justify-between text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                          <span>Endpoint Traffic</span>
                          <span>Monthly Total</span>
                        </div>
                        <div className="space-y-1.5">
                          {p.usage?.models.length ? p.usage.models.map((m, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <span className="text-gray-400 font-medium">{m.name}</span>
                              <span className="font-mono text-white font-bold">{m.tokens.toLocaleString()}</span>
                            </div>
                          )) : <p className="text-center text-[10px] text-gray-600 italic py-2">No activity detected on this node</p>}
                        </div>
                        <div className="pt-2 border-t border-gray-800 flex justify-between items-center">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Estimated Cost</span>
                          <span className="text-xs font-mono text-emerald-500 font-bold">${p.usage?.spentUSD.toFixed(4) || '0.0000'}</span>
                        </div>
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
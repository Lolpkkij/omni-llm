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
import { Badge } from '@/components/ui/badge';
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

        <Card className="lg:col-span-2 bg-gray-900/40 border-gray-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity size={18} className="text-[#6366F1]" /> Node Status
            </CardTitle>
            <Badge variant="outline" className="border-gray-800 text-gray-500 text-[10px]">LIVE</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {providers.filter(p => p.enabled).map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl border border-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      p.health?.status === 'online' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : 
                      p.health?.status === 'offline' ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-gray-700"
                    )} />
                    <span className="text-sm font-medium text-gray-300">{p.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 uppercase">{p.providerType}</span>
                </div>
              ))}
              {providers.filter(p => p.enabled).length === 0 && (
                <p className="text-center text-xs text-gray-600 py-4">No active nodes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900/40 border-gray-800 text-white">
        <CardHeader>
          <CardTitle>Active Provider Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {providers.filter(p => p.enabled).map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-2xl border border-gray-700/50 group hover:border-[#6366F1]/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center font-bold text-[#6366F1]">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{p.name}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{p.baseUrl}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-mono uppercase">{p.providerType}</p>
                  {p.health?.latency && (
                    <p className="text-[10px] text-[#6366F1] font-bold mt-1">{p.health.latency}ms</p>
                  )}
                </div>
              </div>
            ))}
            {providers.filter(p => p.enabled).length === 0 && (
              <div className="py-12 text-center text-gray-500 border-2 border-dashed border-gray-800 rounded-3xl">
                No active providers configured. Add a provider to see details.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
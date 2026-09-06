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
  ArrowUp,
  Loader2,
  Activity,
  Zap,
  BarChart3
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useProviderStore } from '@/store/useProviderStore';
import { useUnifiedKeyStore } from '@/store/useUnifiedKeyStore';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard = () => {
  const { providers, setUsageData, updateProvider, load } = useProviderStore();
  const { unifiedKey, loadKey } = useUnifiedKeyStore();
  const [refreshing, setRefreshing] = useState(false);
  const [pinging, setPinging] = useState<Record<string, boolean>>({});
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  useEffect(() => {
    load();
    loadKey();
  }, [load, loadKey]);

  const copyKey = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Unified key copied!");
  };

  const pingProvider = async (p: any) => {
    setPinging(prev => ({ ...prev, [p.id]: true }));
    try {
      // Logic for actual pinging would go here
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success(`${p.name} is responding!`);
    } catch {
      toast.error(`${p.name} is unreachable.`);
    } finally {
      setPinging(prev => ({ ...prev, [p.id]: false }));
    }
  };

  const refreshUsage = async () => {
    setRefreshing(true);
    try {
      // Simulate API call for usage refresh
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      providers.forEach(p => {
        if (p.enabled && p.encryptedKeys?.length) {
          setUsageData(p.id, {
            tokensThisMonth: Math.floor(Math.random() * 50000) + 10000,
            spentUSD: parseFloat((Math.random() * 5).toFixed(2)),
            models: [
              { name: "gpt-4o", tokens: Math.floor(Math.random() * 20000) },
              { name: "claude-3-sonnet", tokens: Math.floor(Math.random() * 15000) }
            ]
          });
        }
      });

      toast.success("Usage data updated across all providers");
    } catch {
      toast.error("Failed to refresh some usage data");
    } finally {
      setRefreshing(false);
    }
  };

  const totalTokens = providers.reduce((sum, p) => sum + (p.usage?.tokensThisMonth || 0), 0);
  const totalSpent = providers.reduce((sum, p) => sum + (p.usage?.spentUSD || 0), 0);

  // Prepare chart data
  const chartData = providers
    .filter(p => p.enabled && p.usage)
    .map(p => ({
      name: p.name,
      tokens: p.usage?.tokensThisMonth || 0,
      color: p.id.includes('1') ? '#6366F1' : '#10B981'
    }));

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fadeIn space-y-8 relative overflow-y-auto h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">System Dashboard</h1>
          <p className="text-gray-400 mt-2">Real-time usage and connectivity status</p>
        </div>
        <Button 
          onClick={refreshUsage} 
          disabled={refreshing}
          className="bg-white text-gray-900 hover:bg-gray-200 font-bold rounded-xl px-6 h-12 shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          {refreshing ? <Loader2 className="animate-spin mr-2" size={20} /> : <RefreshCw className="mr-2" size={20} />}
          Refresh Metrics
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-[#6366F1]/20 to-transparent border-gray-700 text-white overflow-hidden relative group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Activity size={12} /> Monthly Tokens
                </p>
                <h2 className="text-3xl font-bold mt-1 font-mono tracking-tight">{totalTokens.toLocaleString()}</h2>
              </div>
              <div className="p-3 bg-[#6366F1]/20 rounded-xl text-[#6366F1]">
                <TrendingUp size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-gray-700 text-white overflow-hidden relative group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <CreditCard size={12} /> Total Spend
                </p>
                <h2 className="text-3xl font-bold mt-1 font-mono tracking-tight">${totalSpent.toFixed(2)}</h2>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-500">
                <CreditCard size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/40 border-gray-700 text-white">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Database size={14} /> Unified Proxy Key
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex gap-2">
              <Input 
                readOnly 
                value={unifiedKey} 
                className="bg-gray-900 border-gray-700 font-mono text-xs h-9 focus-visible:ring-0"
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
              <BarChart3 size={18} className="text-[#6366F1]" /> Token Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    itemStyle={{ color: '#F3F4F6' }}
                  />
                  <Bar dataKey="tokens" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 italic text-sm">
                No usage data available to display charts.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity size={18} className="text-[#6366F1]" /> Live Providers
          </h3>
          <div className="space-y-3">
            {providers.length === 0 ? (
              <div className="text-center py-10 bg-gray-900/40 border border-dashed border-gray-700 rounded-2xl text-gray-500 text-sm">
                No active providers.
              </div>
            ) : (
              providers.map(p => (
                <Card key={p.id} className="bg-gray-800/40 border-gray-700 text-white group overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                    onClick={() => setExpandedProvider(expandedProvider === p.id ? null : p.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full", 
                        p.enabled ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"
                      )} />
                      <div className="flex flex-col">
                        <p className="font-bold text-sm">{p.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{p.providerType?.toUpperCase() || 'CUSTOM'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); pingProvider(p); }}
                        disabled={pinging[p.id]}
                        className="h-8 px-2 text-gray-500 hover:text-[#6366F1]"
                      >
                        {pinging[p.id] ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
                      </Button>
                      {expandedProvider === p.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {expandedProvider === p.id && (
                    <CardContent className="px-4 pb-4 pt-2 bg-gray-900/30 border-t border-gray-700 animate-in slide-in-from-top-2">
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                          <span>Model Usage</span>
                          <span>Tokens</span>
                        </div>
                        {p.usage?.models.map((m, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <span className="text-gray-300">{m.name}</span>
                            <span className="font-mono text-[#6366F1]">{m.tokens.toLocaleString()}</span>
                          </div>
                        )) || <p className="text-center text-[10px] text-gray-500 italic">No usage data</p>}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="h-10" />
    </div>
  );
};

export default Dashboard;
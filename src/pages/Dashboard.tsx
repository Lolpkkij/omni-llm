"use client";

import React, { useState } from 'react';
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
  Zap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useProviderStore } from '@/store/useProviderStore';
import { useUnifiedKeyStore } from '@/store/useUnifiedKeyStore';

const Dashboard = () => {
  const { providers, setUsageData, updateProvider } = useProviderStore();
  const { unifiedKey } = useUnifiedKeyStore();
  const [refreshing, setRefreshing] = useState(false);
  const [pinging, setPinging] = useState<Record<string, boolean>>({});
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  const copyKey = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Unified key copied!");
  };

  const pingProvider = async (p: any) => {
    setPinging(prev => ({ ...prev, [p.id]: true }));
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: p.id,
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'ping' }],
          encryptedKey: p.encryptedKeys?.[0] || 'placeholder',
        }),
      });
      if (res.ok) toast.success(`${p.name} is responding!`);
      else throw new Error();
    } catch {
      toast.error(`${p.name} is unreachable.`);
    } finally {
      setPinging(prev => ({ ...prev, [p.id]: false }));
    }
  };

  const refreshUsage = async () => {
    setRefreshing(true);
    try {
      const results = await Promise.all(providers.map(async (p) => {
        if (!p.encryptedKeys?.length) return { id: p.id, usage: null };
        
        try {
          const res = await fetch('/api/usage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              providerId: p.id, 
              encryptedKey: p.encryptedKeys[0] 
            }),
          });
          if (!res.ok) throw new Error();
          const usage = await res.json();
          return { id: p.id, usage };
        } catch (e) {
          return { id: p.id, usage: null };
        }
      }));

      results.forEach(res => {
        if (res.usage) setUsageData(res.id, res.usage);
      });

      toast.success("Usage data updated across all providers");
    } catch (e) {
      toast.error("Failed to refresh some usage data");
    } finally {
      setRefreshing(false);
    }
  };

  const totalTokens = providers.reduce((sum, p) => sum + (p.usage?.tokensThisMonth || 0), 0);
  const totalSpent = providers.reduce((sum, p) => sum + (p.usage?.spentUSD || 0), 0);

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fadeIn space-y-8 relative">
      {refreshing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-[#6366F1]" size={48} />
            <p className="text-white font-medium">Updating Provider Usage...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-[#6366F1]/20 to-transparent border-gray-700 text-white overflow-hidden relative group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-gray-400 text-sm font-medium flex items-center gap-2">
                  <Activity size={14} /> Total Tokens Used
                </p>
                <h2 className="text-4xl font-bold mt-1 font-mono tracking-tight">{totalTokens.toLocaleString()}</h2>
              </div>
              <div className="p-3 bg-[#6366F1]/20 rounded-2xl text-[#6366F1] group-hover:scale-110 transition-transform">
                <TrendingUp size={32} />
              </div>
            </div>
          </CardContent>
          <div className="absolute -right-4 -bottom-4 opacity-10 text-white group-hover:opacity-20 transition-opacity">
            <TrendingUp size={120} />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-gray-700 text-white overflow-hidden relative group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-gray-400 text-sm font-medium flex items-center gap-2">
                  <CreditCard size={14} /> Total Spend (USD)
                </p>
                <h2 className="text-4xl font-bold mt-1 font-mono tracking-tight">${totalSpent.toFixed(2)}</h2>
              </div>
              <div className="p-3 bg-green-500/20 rounded-2xl text-green-500 group-hover:scale-110 transition-transform">
                <CreditCard size={32} />
              </div>
            </div>
          </CardContent>
          <div className="absolute -right-4 -bottom-4 opacity-10 text-white group-hover:opacity-20 transition-opacity">
            <CreditCard size={120} />
          </div>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1 bg-gray-800/40 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Database size={16} /> Unified API Key
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input 
                readOnly 
                value={unifiedKey} 
                className="bg-gray-900 border-gray-700 font-mono text-sm focus-visible:ring-0"
              />
              <Button size="icon" onClick={() => copyKey(unifiedKey)} className="bg-[#6366F1] hover:bg-[#4f46e5]">
                <Copy size={18} />
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-end">
          <Button 
            onClick={refreshUsage} 
            disabled={refreshing}
            className="h-14 px-6 bg-white text-gray-900 hover:bg-gray-200 font-bold rounded-xl transition-all hover:scale-105 active:scale-95"
          >
            {refreshing ? <Loader2 className="animate-spin mr-2" size={20} /> : <RefreshCw className="mr-2" size={20} />}
            Refresh Usage
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Provider Breakdown</h3>
          <span className="text-xs text-gray-500">{providers.length} configured providers</span>
        </div>
        {providers.length === 0 && (
          <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-800 rounded-3xl">
            No providers configured. Add some in the Providers tab!
          </div>
        )}
        <div className="grid grid-cols-1 gap-4">
          {providers.map(p => (
            <Card key={p.id} className="bg-gray-800/40 border-gray-700 text-white overflow-hidden">
              <div 
                className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                onClick={() => setExpandedProvider(expandedProvider === p.id ? null : p.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-2 h-2 rounded-full", p.enabled ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500")} />
                  <div className="flex flex-col">
                    <p className="font-bold">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.encryptedKeys.length} keys configured</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); pingProvider(p); }}
                    disabled={pinging[p.id]}
                    className="text-xs text-gray-400 hover:text-white h-8 px-2 flex items-center gap-1"
                  >
                    {pinging[p.id] ? <Loader2 className="animate-spin" size={12} /> : <Zap size={12} />}
                    Ping
                  </Button>
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Monthly Spend</p>
                    <p className="font-mono font-bold text-green-400">${p.usage?.spentUSD?.toFixed(2) || "0.00"}</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Tokens</p>
                    <p className="font-mono font-bold">{p.usage?.tokensThisMonth?.toLocaleString() || "0"}</p>
                  </div>
                  {expandedProvider === p.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </div>
              </div>

              {expandedProvider === p.id && (
                <CardContent className="p-4 bg-gray-900/30 border-t border-gray-700 animate-in slide-in-from-top-2">
                  {p.usage ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Model Consumption</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {p.usage.models.map((m, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-gray-800 rounded-xl border border-gray-700 group hover:border-gray-600 transition-colors">
                            <span className="text-sm font-medium">{m.name}</span>
                            <span className="font-mono text-sm text-gray-400">{m.tokens.toLocaleString()} tokens</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-sm text-gray-500 italic">
                      Usage tracking not available for this provider.
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-all z-10"
      >
        <ArrowUp size={24} />
      </button>
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default Dashboard;
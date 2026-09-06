"use client";

import React from 'react';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useProviderStore } from '@/store/useProviderStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { cn } from '@/lib/utils';

const Analytics = () => {
  const { providers } = useProviderStore();

  const totalTokens = providers.reduce((sum, p) => sum + (p.usage?.tokensThisMonth || 0), 0);
  const totalSpent = providers.reduce((sum, p) => sum + (p.usage?.spentUSD || 0), 0);

  const providerData = providers
    .filter(p => p.enabled && p.usage)
    .map(p => ({
      name: p.name,
      value: p.usage?.tokensThisMonth || 0,
      cost: p.usage?.spentUSD || 0,
      color: p.providerType === 'openai' ? '#10b981' : 
             p.providerType === 'anthropic' ? '#f59e0b' : '#6366F1'
    }));

  const modelDistribution = providers.flatMap(p => 
    p.usage?.models.map(m => ({
      name: `${p.name} - ${m.name}`,
      tokens: m.tokens
    })) || []
  ).sort((a, b) => b.tokens - a.tokens).slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fadeIn space-y-8 relative overflow-y-auto h-full pb-20">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white tracking-tight">Usage Analytics</h1>
        <p className="text-gray-400 text-lg">Detailed breakdown of your AI consumption and efficiency metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800/40 border-gray-700 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Monthly Tokens</p>
                <h2 className="text-3xl font-bold font-mono">{totalTokens.toLocaleString()}</h2>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                  <TrendingUp size={12} /> 12% vs last month
                </div>
              </div>
              <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                <Zap size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/40 border-gray-700 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Estimated Monthly Cost</p>
                <h2 className="text-3xl font-bold font-mono">${totalSpent.toFixed(2)}</h2>
                <div className="flex items-center gap-1 text-red-400 text-xs font-bold">
                  <TrendingUp size={12} /> 8.4% cost increase
                </div>
              </div>
              <div className="p-4 bg-yellow-500/10 text-yellow-500 rounded-2xl">
                <DollarSign size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/40 border-gray-700 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Avg. Latency</p>
                <h2 className="text-3xl font-bold font-mono">342ms</h2>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                  <ArrowDownRight size={12} /> -15% faster
                </div>
              </div>
              <div className="p-4 bg-purple-500/10 text-purple-500 rounded-2xl">
                <Activity size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800/40 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={18} className="text-[#6366F1]" /> Token Volume by Provider
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={providerData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
                <YAxis stroke="#9CA3AF" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0b2e', border: '1px solid #374151', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="value" name="Tokens" radius={[8, 8, 0, 0]}>
                  {providerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/40 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon size={18} className="text-[#6366F1]" /> Cost Distribution (%)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={providerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="cost"
                >
                  {providerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0b2e', border: '1px solid #374151', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Total</p>
              <p className="text-xl font-bold">${totalSpent.toFixed(0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800/40 border-gray-700 text-white">
        <CardHeader>
          <CardTitle>Top Model Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {modelDistribution.map((model, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-2xl border border-gray-700/50 group hover:border-[#6366F1]/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center font-bold text-[#6366F1]">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{model.name}</p>
                    <p className="text-[10px] text-gray-500 font-mono">Ranked by token throughput</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold text-[#6366F1]">{model.tokens.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500">tokens</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
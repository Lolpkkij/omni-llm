"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Plus, 
  Trash2, 
  Zap, 
  Clock, 
  BarChart2, 
  LayoutGrid, 
  Bot,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useProviderStore } from '@/store/useProviderStore';
import { MODEL_CATALOG, ModelCapability } from '@/lib/modelRouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type PlaygroundModel = {
  id: string;
  config: ModelCapability;
  response: string;
  isStreaming: boolean;
  metrics: {
    startTime: number;
    firstTokenTime?: number;
    endTime?: number;
    tokenCount: number;
  };
};

const Playground = () => {
  const { providers } = useProviderStore();
  const [prompt, setPrompt] = useState('');
  const [activeModels, setActiveModels] = useState<PlaygroundModel[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Available models based on enabled providers
  const availableModels = MODEL_CATALOG.filter(m => 
    providers.some(p => p.enabled && p.encryptedKeys?.length && p.providerType === m.providerType)
  );

  const addModel = (modelId: string) => {
    const config = MODEL_CATALOG.find(m => m.id === modelId);
    if (!config) return;
    
    setActiveModels(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        config,
        response: '',
        isStreaming: false,
        metrics: { startTime: 0, tokenCount: 0 }
      }
    ]);
  };

  const removeModel = (id: string) => {
    setActiveModels(prev => prev.filter(m => m.id !== id));
  };

  const runPlayground = async () => {
    if (!prompt.trim() || activeModels.length === 0) return;

    // Reset models for new run
    setActiveModels(prev => prev.map(m => ({
      ...m,
      response: '',
      isStreaming: true,
      metrics: { startTime: Date.now(), tokenCount: 0 }
    })));

    // Run all models in parallel
    activeModels.forEach(async (pModel, index) => {
      try {
        const provider = providers.find(p => p.providerType === pModel.config.providerType && p.enabled);
        if (!provider) throw new Error("Provider not found");

        const res = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: provider.id,
            model: pModel.config.id,
            messages: [{ role: 'user', content: prompt }],
            params: { temperature: 0.7, maxTokens: 1024, useCache: false }
          }),
        });

        if (!res.ok) throw new Error('API Error');

        const reader = res.body?.getReader();
        let fullText = '';
        let firstToken = true;

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          fullText += chunk;

          setActiveModels(prev => {
            const updated = [...prev];
            const target = updated.find(m => m.id === pModel.id);
            if (target) {
              target.response = fullText;
              target.metrics.tokenCount += chunk.length / 4; // Approx tokens
              if (firstToken) {
                target.metrics.firstTokenTime = Date.now() - target.metrics.startTime;
                firstToken = false;
              }
            }
            return updated;
          });
        }

        setActiveModels(prev => {
          const updated = [...prev];
          const target = updated.find(m => m.id === pModel.id);
          if (target) {
            target.isStreaming = false;
            target.metrics.endTime = Date.now();
          }
          return updated;
        });

      } catch (e: any) {
        toast.error(`${pModel.config.name}: ${e.message}`);
        setActiveModels(prev => {
          const updated = [...prev];
          const target = updated.find(m => m.id === pModel.id);
          if (target) target.isStreaming = false;
          return updated;
        });
      }
    });
  };

  return (
    <div className="flex flex-col h-full w-full animate-fadeIn overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <LayoutGrid className="text-[#6366F1]" /> Model Playground
          </h1>
          <p className="text-gray-400 text-sm mt-1">Benchmarking and side-by-side quality comparison.</p>
        </div>

        <div className="flex items-center gap-2">
          <select 
            onChange={(e) => addModel(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-4 py-2 outline-none focus:ring-2 ring-[#6366F1]"
            defaultValue=""
          >
            <option value="" disabled>Add Model to Compare...</option>
            {availableModels.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <Button 
            onClick={runPlayground} 
            disabled={activeModels.length === 0 || !prompt.trim() || activeModels.some(m => m.isStreaming)}
            className="bg-[#6366F1] hover:bg-[#4f46e5] text-white font-bold rounded-xl px-6"
          >
            <Zap size={18} className="mr-2" /> Run Comparison
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-x-auto flex flex-col">
        <div className="p-6 h-40 border-b border-gray-800 shrink-0">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your test prompt here... All selected models will respond to this simultaneously."
            className="w-full h-full bg-gray-800/50 text-white p-4 rounded-2xl border border-gray-700 outline-none focus:border-[#6366F1] transition-all resize-none shadow-inner"
          />
        </div>

        <div className="flex-1 overflow-x-auto p-6 bg-gray-950/20">
          <div className="flex gap-6 h-full min-w-max">
            {activeModels.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-3xl p-20 min-w-[600px] mx-auto">
                <div className="p-4 bg-gray-900 rounded-2xl mb-4">
                  <LayoutGrid size={48} className="opacity-20" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Ready to Benchmark?</h3>
                <p className="max-w-xs text-center text-sm">Select models from the dropdown to start your side-by-side comparison session.</p>
              </div>
            ) : (
              activeModels.map((model) => (
                <div key={model.id} className="w-[450px] flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300">
                  <Card className="bg-gray-800/40 border-gray-700 flex flex-col h-full shadow-2xl group overflow-hidden">
                    <CardHeader className="p-4 border-b border-gray-700 flex flex-row items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#6366F1]/20 text-[#6366F1] rounded-lg flex items-center justify-center">
                          <Bot size={16} />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold text-white">{model.config.name}</CardTitle>
                          <p className="text-[10px] text-gray-500 font-mono uppercase">{model.config.providerType}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeModel(model.id)}
                        className="text-gray-600 hover:text-red-400 h-8 w-8"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </CardHeader>

                    {/* Metrics Bar */}
                    <div className="px-4 py-2 bg-gray-900/50 border-b border-gray-700 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-amber-500" />
                          <span className="text-[10px] text-gray-400 font-mono">
                            {model.metrics.firstTokenTime ? `${model.metrics.firstTokenTime}ms` : '---'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap size={12} className="text-emerald-500" />
                          <span className="text-[10px] text-gray-400 font-mono">
                            {model.metrics.endTime ? `${Math.round(model.metrics.tokenCount / ((model.metrics.endTime - model.metrics.startTime) / 1000))} t/s` : '---'}
                          </span>
                        </div>
                      </div>
                      {model.isStreaming && (
                        <div className="flex gap-1">
                          <span className="w-1 h-1 bg-[#6366F1] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1 h-1 bg-[#6366F1] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-1 bg-[#6366F1] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                      <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-sans">
                        {model.response || (model.isStreaming ? '' : <span className="text-gray-600 italic">Waiting for prompt run...</span>)}
                      </div>
                    </CardContent>

                    <div className="p-3 border-t border-gray-700 bg-gray-900/30 flex items-center justify-between">
                       <Badge variant="outline" className="text-[10px] border-gray-700 text-gray-500">
                         {model.config.isFree ? 'FREE' : 'PREMIUM'}
                       </Badge>
                       {model.metrics.tokenCount > 0 && (
                         <span className="text-[10px] text-gray-500">{Math.round(model.metrics.tokenCount)} tokens generated</span>
                       )}
                    </div>
                  </Card>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Playground;
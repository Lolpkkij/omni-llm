"use client";

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Globe,
  ShieldCheck,
  Key as KeyIcon,
  ExternalLink,
  Power,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useProviderStore, type Provider } from '@/store/useProviderStore';
import ProviderModal from '@/components/ProviderModal';
import ConfirmModal from '@/components/ConfirmModal';
import { cn } from '@/lib/utils';

const Providers = () => {
  const { providers, load, removeProvider, updateProvider } = useProviderStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (deleteId) {
      await removeProvider(deleteId);
      toast.success("Provider removed");
      setDeleteId(null);
    }
  };

  const toggleProvider = async (provider: Provider) => {
    await updateProvider(provider.id, { enabled: !provider.enabled });
    toast.success(`${provider.name} ${!provider.enabled ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">AI Providers</h1>
          <p className="text-gray-400 mt-2">Configure endpoints and authentication for your model providers</p>
        </div>

        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#6366F1] hover:bg-[#4f46e5] text-white rounded-full px-6 py-6 font-bold shadow-lg shadow-[#6366F1]/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={20} className="mr-2" /> Add New Provider
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {providers.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/20 border-2 border-dashed border-gray-700 rounded-3xl">
            <div className="bg-gray-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-500">
              <Globe size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white">No providers yet</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">
              Add your first provider to start routing AI requests through OmniLLM.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(true)}
              className="mt-6 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Configure Provider
            </Button>
          </div>
        ) : (
          providers.map((p) => (
            <Card key={p.id} className={cn(
              "bg-gray-800/40 border-gray-700 overflow-hidden transition-all hover:border-[#6366F1]/50 group",
              !p.enabled && "opacity-60"
            )}>
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        p.enabled ? "bg-[#6366F1]/20 text-[#6366F1]" : "bg-gray-700 text-gray-500"
                      )}>
                        <Globe size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-white">{p.name}</h3>
                          {p.enabled ? (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500 border-gray-700">Disabled</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 font-mono mt-1">{p.baseUrl}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Auth Strategy</p>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <ShieldCheck size={14} className="text-[#6366F1]" />
                          {p.auth.type.toUpperCase()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Stored Keys</p>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <KeyIcon size={14} className="text-[#6366F1]" />
                          {p.encryptedKeys?.length || 0} keys
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Provider Type</p>
                        <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-[10px]">
                          {p.providerType || 'CUSTOM'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Endpoint Path</p>
                        <p className="text-xs text-gray-400 font-mono truncate">{p.modelPath || '/chat/completions'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-900/40 border-t md:border-t-0 md:border-l border-gray-700 p-4 flex md:flex-col justify-center gap-2 min-w-[120px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleProvider(p)}
                      className={cn(
                        "w-full justify-start",
                        p.enabled ? "text-red-400 hover:text-red-300 hover:bg-red-400/10" : "text-green-400 hover:text-green-300 hover:bg-green-400/10"
                      )}
                    >
                      <Power size={16} className="mr-2" />
                      {p.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-gray-400 hover:text-white"
                      onClick={() => window.open(p.baseUrl, '_blank')}
                    >
                      <ExternalLink size={16} className="mr-2" />
                      Visit
                    </Button>
                    <div className="h-px bg-gray-700 my-1 hidden md:block" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(p.id)}
                      className="w-full justify-start text-gray-500 hover:text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ProviderModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      <ConfirmModal
        open={!!deleteId}
        title="Remove Provider?"
        description="This will delete the provider configuration and all associated API keys stored for it. This action cannot be undone."
        confirmLabel="Remove Provider"
        cancelLabel="Keep Provider"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default Providers;
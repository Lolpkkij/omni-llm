"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useProviderStore } from "@/store/useProviderStore";
import { toast } from "sonner";

interface ProviderModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProviderModal({ open, onClose }: ProviderModalProps) {
  const { addProvider } = useProviderStore();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [modelPath, setModelPath] = useState("/chat/completions");
  const [authType, setAuthType] = useState<"header" | "query" | "body">("header");
  const [keyName, setKeyName] = useState("Authorization");
  const [prefix, setPrefix] = useState("Bearer ");
  const [bodyTemplate, setBodyTemplate] = useState("");
  const [supportsUsage, setSupportsUsage] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [order, setOrder] = useState(0);

  const resetForm = () => {
    setName("");
    setBaseUrl("");
    setModelPath("/chat/completions");
    setAuthType("header");
    setKeyName("Authorization");
    setPrefix("Bearer ");
    setBodyTemplate("");
    setSupportsUsage(false);
    setEnabled(true);
    setOrder(0);
  };

  const handleCreate = async () => {
    if (!name || !baseUrl) {
      toast.error("Name and Base URL are required");
      return;
    }

    setLoading(true);
    try {
      await addProvider({
        name,
        baseUrl,
        // These are for the proxy server logic, though not strictly in the Provider type 
        // we might need to update the type if we want to persist these. 
        // For now, we align with the current useProviderStore.addProvider.
        auth: { type: authType, keyName, prefix: prefix || undefined },
        enabled,
        order,
        // Note: If the Provider type in lib/providerConfig doesn't have these, 
        // they will be stripped or cause TS errors. 
        // Based on current Provider type: id, name, baseUrl, auth, encryptedKeys, providerType, detectedModel, enabled, order.
      } as any);

      toast.success("Provider created successfully");
      resetForm();
      onClose();
    } catch (e) {
      toast.error("Failed to create provider");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md rounded-3xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add Custom Provider</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-gray-400">Provider Name</Label>
            <Input 
              placeholder="e.g. My Local LLM" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="bg-gray-900 border-gray-700" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400">Base URL</Label>
            <Input 
              placeholder="https://api.openai.com/v1" 
              value={baseUrl} 
              onChange={e => setBaseUrl(e.target.value)}
              className="bg-gray-900 border-gray-700" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400">Auth Type</Label>
              <Select value={authType} onValueChange={v => setAuthType(v as any)}>
                <SelectTrigger className="bg-gray-900 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="header">Header</SelectItem>
                  <SelectItem value="query">Query</SelectItem>
                  <SelectItem value="body">Body</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">Auth Key Name</Label>
              <Input 
                placeholder="Authorization" 
                value={keyName} 
                onChange={e => setKeyName(e.target.value)}
                className="bg-gray-900 border-gray-700" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400">Prefix (Optional)</Label>
            <Input 
              placeholder="Bearer " 
              value={prefix} 
              onChange={e => setPrefix(e.target.value)}
              className="bg-gray-900 border-gray-700" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400">Model Path (Optional)</Label>
            <Input 
              placeholder="/chat/completions" 
              value={modelPath} 
              onChange={e => setModelPath(e.target.value)}
              className="bg-gray-900 border-gray-700" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400">Body Template (Optional)</Label>
            <textarea 
              className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white text-sm focus:ring-2 ring-[#6366F1] outline-none"
              rows={3}
              placeholder="({ model, messages }) => ({ model, messages, stream: true })"
              value={bodyTemplate}
              onChange={e => setBodyTemplate(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl border border-gray-700">
            <Label htmlFor="enabled" className="text-gray-300 cursor-pointer">Enabled</Label>
            <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl border border-gray-700">
            <Label htmlFor="usage" className="text-gray-300 cursor-pointer">Supports Usage Endpoint</Label>
            <Switch id="usage" checked={supportsUsage} onCheckedChange={setSupportsUsage} />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400">Sort Order</Label>
            <Input 
              type="number" 
              value={order} 
              onChange={e => setOrder(Number(e.target.value))}
              className="bg-gray-900 border-gray-700" 
            />
          </div>
          <Button 
            onClick={handleCreate} 
            disabled={loading}
            className="w-full bg-[#6366F1] hover:bg-[#4f46e5] py-6 font-bold rounded-xl mt-4"
          >
            {loading ? "Creating..." : "Create Provider"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
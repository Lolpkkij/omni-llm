"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
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

type ProviderFormProps = {
  initial?: Partial<{
    name: string;
    baseUrl: string;
    modelPath: string;
    authType: "header" | "query" | "body";
    keyName: string;
    prefix: string;
    bodyTemplate: string;
    supportsUsage: boolean;
    enabled: boolean;
    order: number;
  }>;
  onSubmit: (data: any) => Promise<void>;
  submitLabel: string;
};

export default function ProviderForm({
  initial = {},
  onSubmit,
  submitLabel,
}: ProviderFormProps) {
  const [name, setName] = useState(initial.name ?? "");
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl ?? "");
  const [modelPath, setModelPath] = useState(initial.modelPath ?? "/chat/completions");
  const [authType, setAuthType] = useState<"header" | "query" | "body">(initial.authType ?? "header");
  const [keyName, setKeyName] = useState(initial.keyName ?? "Authorization");
  const [prefix, setPrefix] = useState(initial.prefix ?? "Bearer ");
  const [bodyTemplate, setBodyTemplate] = useState(initial.bodyTemplate ?? "");
  const [supportsUsage, setSupportsUsage] = useState(initial.supportsUsage ?? false);
  const [enabled, setEnabled] = useState(initial.enabled ?? true);
  const [order, setOrder] = useState(initial.order ?? 0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      name,
      baseUrl,
      modelPath,
      auth: { type: authType, keyName, prefix: prefix || undefined },
      bodyTemplate: bodyTemplate || undefined,
      encryptedKeys: [], // empty initially; keys added via API‑Keys page
      flags: { supportsUsage },
      enabled,
      order,
    });
    setLoading(false);
  };

  return (
    <Card className="bg-gray-800/40 border-gray-700">
      <CardHeader>
        <CardTitle>{submitLabel} Provider</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Base URL</Label>
            <Input
              placeholder="https://api.openai.com/v1"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Model Path</Label>
            <Input
              placeholder="/chat/completions"
              value={modelPath}
              onChange={(e) => setModelPath(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Auth Type</Label>
            <Select value={authType} onValueChange={(v) => setAuthType(v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select auth type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="query">Query</SelectItem>
                <SelectItem value="body">Body</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Key Name</Label>
            <Input
              placeholder="Authorization or api_key"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Prefix (optional)</Label>
            <Input
              placeholder="Bearer "
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Body Template (optional)</Label>
            <textarea
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
              rows={4}
              placeholder="({ model, messages, userKey }) => ({ model, messages, stream: true })"
              value={bodyTemplate}
              onChange={(e) => setBodyTemplate(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="supports-usage"
              checked={supportsUsage}
              onCheckedChange={setSupportsUsage}
            />
            <Label htmlFor="supports-usage">Supports Usage Endpoint</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
            <Label htmlFor="enabled">Enabled</Label>
          </div>

          <div className="space-y-2">
            <Label>Order (optional)</Label>
            <Input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving…" : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
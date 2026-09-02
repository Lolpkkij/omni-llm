"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Plus } from "lucide-react";
import ProviderForm from "@/components/ProviderForm";
import { toast } from "sonner";

type Provider = {
  id: string;
  name: string;
  baseUrl: string;
  modelPath: string;
  auth: {
    type: "header" | "query" | "body";
    keyName: string;
    prefix?: string;
  };
  bodyTemplate?: string;
  encryptedKeys: string[];
  flags?: { supportsUsage?: boolean };
  enabled: boolean;
  order?: number;
};

export default function Providers() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadProviders = async () => {
    try {
      const res = await fetch("/api/providers");
      const data = await res.json();
      setProviders(data);
    } catch (e) {
      toast.error("Failed to load providers");
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleCreate = async (payload: any) => {
    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Create failed");
      await loadProviders();
      toast.success("Provider added");
      setShowForm(false);
    } catch (e) {
      toast.error("Failed to add provider");
    }
  };

  const handleUpdate = async (payload: any) => {
    if (!editing) return;
    try {
      const res = await fetch(`/api/providers/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");
      await loadProviders();
      toast.success("Provider updated");
      setEditing(null);
    } catch (e) {
      toast.error("Failed to update provider");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/providers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await loadProviders();
      toast.success("Provider removed");
    } catch (e) {
      toast.error("Failed to delete provider");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Custom Providers</h1>
        <Button
          variant="default"
          size="icon"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus size={20} />
        </Button>
      </div>

      {showForm && (
        <ProviderForm
          initial={editing ?? undefined}
          onSubmit={editing ? handleUpdate : handleCreate}
          submitLabel={editing ? "Update" : "Create"}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {providers.map((p) => (
          <Card key={p.id} className="bg-gray-800/40 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{p.name}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditing(p);
                    setShowForm(true);
                  }}
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(p.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-300">
              <p>
                <strong>Base URL:</strong> {p.baseUrl}
              </p>
              <p>
                <strong>Model Path:</strong> {p.modelPath}
              </p>
              <p>
                <strong>Auth:</strong> {p.auth.type} ({p.auth.keyName}
                {p.auth.prefix ? `, prefix "${p.auth.prefix}"` : ""})
              </p>
              {p.flags?.supportsUsage && (
                <p className="text-green-400">Supports usage endpoint</p>
              )}
              <p className={p.enabled ? "text-green-400" : "text-red-400"}>
                {p.enabled ? "Enabled" : "Disabled"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
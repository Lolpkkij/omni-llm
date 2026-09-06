"use client";

import React from 'react';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Cpu, 
  Monitor, 
  Trash2, 
  RotateCcw,
  ShieldAlert,
  Save,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useSessionStore } from '@/store/useSessionStore';
import { toast } from 'sonner';

const Settings = () => {
  const { 
    autoRoutingPreference, setAutoRoutingPreference,
    compactMode, setCompactMode,
    developerMode, setDeveloperMode
  } = useSettingsStore();

  const { clearAllSessions } = useSessionStore();

  const handleClearCache = () => {
    if (confirm("This will permanently delete all chat history. Are you sure?")) {
      clearAllSessions();
      toast.success("Chat history cleared");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fadeIn space-y-8 relative overflow-y-auto h-full pb-20">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold text-white tracking-tight">Preferences</h1>
        <p className="text-gray-400">Configure your global AI gateway and interface settings.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-gray-800/40 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="text-[#6366F1]" /> Routing Strategy
            </CardTitle>
            <CardDescription className="text-gray-400">
              Decide how the Auto-Router prioritizes models when handling your requests.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-bold">Optimization Mode</Label>
                <p className="text-xs text-gray-500">Affects both Auto-Free and Auto-Premium logic.</p>
              </div>
              <Select 
                value={autoRoutingPreference} 
                onValueChange={(v: any) => setAutoRoutingPreference(v)}
              >
                <SelectTrigger className="w-48 bg-gray-900 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="performance">Performance First</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="cost">Minimum Cost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/40 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="text-[#6366F1]" /> Interface Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-2xl border border-gray-700/50">
              <div className="space-y-1">
                <Label className="text-sm font-bold">Compact Chat Mode</Label>
                <p className="text-xs text-gray-500">Reduces spacing between message bubbles.</p>
              </div>
              <Switch checked={compactMode} onCheckedChange={setCompactMode} />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-2xl border border-gray-700/50">
              <div className="space-y-1">
                <Label className="text-sm font-bold">Developer Verbosity</Label>
                <p className="text-xs text-gray-500">Show raw response JSON and headers in chat.</p>
              </div>
              <Switch checked={developerMode} onCheckedChange={setDeveloperMode} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/40 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <ShieldAlert /> Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
              <div className="space-y-1">
                <p className="text-sm font-bold text-red-400">Flush Chat Database</p>
                <p className="text-xs text-gray-500">Delete all 100% of local chat sessions.</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleClearCache}
                className="bg-red-500 hover:bg-red-600 rounded-xl font-bold"
              >
                <Trash2 size={16} className="mr-2" /> Clear History
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-2xl border border-gray-700">
              <div className="space-y-1">
                <p className="text-sm font-bold">Reset Gateway Keys</p>
                <p className="text-xs text-gray-500">Invalidates current proxy credentials.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-gray-700 hover:bg-gray-800 rounded-xl"
              >
                <RotateCcw size={16} className="mr-2" /> Reset Key
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
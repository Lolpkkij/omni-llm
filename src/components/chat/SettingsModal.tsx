"use client";

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from '@/components/ui/dialog';
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
import { 
  Cpu, 
  Monitor, 
  Trash2, 
  ShieldAlert
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useSessionStore } from '@/store/useSessionStore';
import { toast } from 'sonner';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsModal = ({
  open,
  onClose
}: SettingsModalProps) => {
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md rounded-3xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Chat Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Routing Preference */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <Cpu size={16} className="text-[#6366F1]" />
              <span>Routing Strategy</span>
            </div>
            <p className="text-xs text-gray-400">Decide how the Auto-Router prioritizes models.</p>
            <Select 
              value={autoRoutingPreference} 
              onValueChange={(v: any) => setAutoRoutingPreference(v)}
            >
              <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white">
                <SelectValue placeholder="Select strategy" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="performance">Performance First</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="cost">Minimum Cost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Interface */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <Monitor size={16} className="text-[#6366F1]" />
              <span>Interface Options</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-900/40 rounded-xl border border-gray-700">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-gray-300">Compact Mode</Label>
                <p className="text-[10px] text-gray-500">Less bubble spacing.</p>
              </div>
              <Switch checked={compactMode} onCheckedChange={setCompactMode} />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-900/40 rounded-xl border border-gray-700">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-gray-300">Developer Verbosity</Label>
                <p className="text-[10px] text-gray-500">Show model debugging logs.</p>
              </div>
              <Switch checked={developerMode} onCheckedChange={setDeveloperMode} />
            </div>
          </div>

          {/* Danger Zone */}
          <div className="space-y-3 pt-2 border-t border-gray-700">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-400">
              <ShieldAlert size={16} />
              <span>Danger Zone</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-xl border border-red-500/20">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-red-400 block">Clear History</span>
                <p className="text-[10px] text-gray-500">Delete all chat logs.</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleClearCache}
                className="bg-red-500 hover:bg-red-600 rounded-lg text-xs"
              >
                <Trash2 size={12} className="mr-1" /> Clear
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
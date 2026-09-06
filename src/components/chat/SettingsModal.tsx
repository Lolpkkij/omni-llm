"use client";

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from '@/components/ui/dialog';
import { 
  Button, 
  Switch, 
  Label, 
} from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
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
import { useSettingsStore } from '@/store/useSettingsStore';
import { useSessionStore } from '@/store/useSessionStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Preferences</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-gray-400">Provider Name</Label>
            {/* ... rest of the settings modal content ... */}
          </div>
          {/* ... */}
        </div>
      </DialogContent>
    </Dialog>
  );
};
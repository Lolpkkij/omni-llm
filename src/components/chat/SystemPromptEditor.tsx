"use client";

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface SystemPromptEditorProps {
  open: boolean;
  onClose: () => void;
  systemPrompt: string;
  setSystemPrompt: (val: string) => void;
  currentSessionId: string | null;
  updateSession: (id: string, updates: Partial<any>) => void;
}

export const SystemPromptEditor = ({
  open,
  onClose,
  systemPrompt,
  setSystemPrompt,
  currentSessionId,
  updateSession
}: SystemPromptEditorProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md rounded-3xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold">Edit System Persona</DialogTitle>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={18} />
          </button>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Label className="text-xs font-bold text-emerald-500 uppercase tracking-widest">System Instructions</Label>
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="bg-gray-900 border border-emerald-500/20 rounded-xl p-3 text-xs text-gray-300 outline-none focus:ring-1 ring-emerald-500/50 resize-none h-32"
            placeholder="Assign a role to the AI (e.g. 'You are a professional Python expert'). This instruction persists for this conversation."
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              if (currentSessionId) {
                updateSession(currentSessionId, { systemPrompt });
              }
              onClose();
            }}
            className="bg-[#6366F1] hover:bg-[#4f46e5]"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
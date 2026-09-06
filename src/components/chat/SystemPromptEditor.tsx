"use client";

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from '@/components/ui/dialog';
import { 
  Label, 
  Button 
} from '@/components/ui/button';
import { X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface SystemPromptEditorProps {
  open: boolean;
  onClose: () => void;
  systemPrompt: string;
  setSystemPrompt: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
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
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Label className="text-xs font-bold text-emerald-500 uppercase tracking-widest">System Instructions</Label>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={14} /></button>
        </div>
        <Textarea
          value={systemPrompt}
          onChange={setSystemPrompt}
          className="bg-gray-900 border border-emerald-500/20 rounded-xl p-3 text-xs text-gray-300 outline-none focus:ring-1 ring-emerald-500/50 resize-none"
          placeholder="Assign a role to the AI (e.g. 'You are a professional Python expert'). This instruction persists for this conversation."
          rows={2}
        />
        <div className="flex justify-end">
          <Button
            onClick={() => {
              /* Save logic would be here */
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
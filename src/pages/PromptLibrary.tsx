"use client";

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Copy, 
  FileText, 
  Sparkles,
  Tag,
  Code,
  PenTool,
  Terminal
} from 'lucide-react';
import { usePromptStore, PromptTemplate } from '@/store/usePromptStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const categories = ["Coding", "Writing", "General", "Analysis", "Persona"];

const PromptLibrary = () => {
  const { templates, addTemplate, removeTemplate, updateTemplate } = usePromptStore();
  const [search, setSearch] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);

  const filtered = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Prompt content copied!");
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-6 animate-fadeIn space-y-8 relative overflow-y-auto h-full pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Prompt Library</h1>
          <p className="text-gray-400 mt-2">Design and save reusable system instructions and templates</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <Input 
              placeholder="Search library..." 
              className="pl-10 w-full md:w-64 bg-gray-800/50 border-gray-700 text-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <PromptModal />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(template => (
          <Card key={template.id} className="bg-gray-800/40 border-gray-700 hover:border-[#6366F1]/50 transition-all group">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg text-white group-hover:text-[#6366F1] transition-colors">
                    {template.name}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] bg-gray-900 border-gray-700 text-gray-400">
                    {template.category}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleCopy(template.content)} className="h-8 w-8 text-gray-500 hover:text-[#6366F1]">
                    <Copy size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeTemplate(template.id)} className="h-8 w-8 text-gray-500 hover:text-red-400">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-700/50 h-32 overflow-y-auto text-xs text-gray-400 leading-relaxed custom-scrollbar">
                {template.content}
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-600">
                <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
                {template.isSystem && (
                  <span className="flex items-center gap-1 text-[#6366F1] font-bold">
                    <Sparkles size={10} /> SYSTEM PROMPT
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const PromptModal = () => {
  const { addTemplate } = usePromptStore();
  const [form, setForm] = useState({
    name: '',
    category: 'General',
    content: '',
    isSystem: true
  });
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.content) {
      toast.error("Name and Content are required");
      return;
    }
    addTemplate(form);
    toast.success("Template saved to library");
    setForm({ name: '', category: 'General', content: '', isSystem: true });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#6366F1] hover:bg-[#4f46e5] text-white rounded-full px-6">
          <Plus size={20} className="mr-2" /> New Template
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a0b2e] border-gray-700 text-white sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-gray-400">Template Name</Label>
            <Input 
              placeholder="e.g. Code Optimizer" 
              className="bg-gray-900 border-gray-700 text-white" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400">Category</Label>
            <select 
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white outline-none focus:ring-2 ring-[#6366F1]"
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value})}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400">Prompt Content</Label>
            <textarea 
              placeholder="Enter the system instructions or template content..." 
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white text-sm min-h-[150px] outline-none focus:ring-2 ring-[#6366F1]"
              value={form.content} 
              onChange={e => setForm({...form, content: e.target.value})}
            />
          </div>
          <Button 
            onClick={handleSubmit} 
            className="w-full bg-[#6366F1] hover:bg-[#4f46e5] text-white rounded-xl py-6 font-bold mt-4"
          >
            Add to Library
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromptLibrary;
"use client";

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Key, 
  Server, 
  Menu, 
  X, 
  Code2, 
  Box,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/chat", label: "Chat Studio", icon: MessageSquare },
  { href: "/api-keys", label: "Secret Keys", icon: Key },
  { href: "/providers", label: "AI Providers", icon: Server },
  { href: "/local-hub", label: "Local Models", icon: Box },
  { href: "/developer", label: "Developer API", icon: Code2 },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0b2e]/80 backdrop-blur-md border-b border-gray-800 z-50 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#6366F1] to-[#818cf8] rounded-lg flex items-center justify-center">
            <Box className="text-white" size={18} />
          </div>
          <span className="text-lg font-bold text-white">OmniLLM</span>
        </div>
        <button 
          className="p-2 bg-gray-800 text-white rounded-xl border border-gray-700"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#0a0b2e] border-r border-gray-800/50 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[#6366F1] to-[#818cf8] rounded-2xl flex items-center justify-center shadow-lg shadow-[#6366F1]/20">
            <Box className="text-white" size={22} />
          </div>
          <div>
            <span className="text-2xl font-bold text-white tracking-tighter block">OmniLLM</span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Universal Gateway</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          <p className="px-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4">Navigation</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "group flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 relative",
                  isActive 
                    ? "bg-[#6366F1]/10 text-[#818cf8] border border-[#6366F1]/20" 
                    : "text-gray-500 hover:bg-gray-800/50 hover:text-gray-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={cn(isActive ? "text-[#6366F1]" : "text-gray-600 group-hover:text-gray-400")} />
                  <span className="font-semibold text-sm">{item.label}</span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 bg-[#6366F1] rounded-full shadow-[0_0_8px_#6366F1]" />
                )}
                {!isActive && (
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-700" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6">
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-3xl p-5 border border-gray-800">
            <p className="text-xs text-gray-400 font-medium mb-3">Gateway Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
              <span className="text-xs text-white font-bold">Systems Online</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
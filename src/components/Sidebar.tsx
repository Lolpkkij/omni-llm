import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Key, Server, Menu, X, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/api-keys", label: "API Keys", icon: Key },
  { href: "/providers", label: "Providers", icon: Server },
  { href: "/developer", label: "Developer", icon: Code2 },
  { href: "/local-hub", label: "Local Hub", icon: Server },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md border border-gray-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#0a0b2e] border-r border-gray-800 transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#6366F1] rounded-lg flex items-center justify-center">
            <MessageSquare className="text-white" size={18} />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">OmniLLM</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                location.pathname === item.href 
                  ? "bg-[#6366F1] text-white" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
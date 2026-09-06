"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MessageBubble({
  role,
  content,
}: {
  role: "user" | "assistant" | "system";
  content: string;
}) {
  const isUser = role === "user";
  const isSystem = role === "system";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(
      "flex mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300",
      isUser ? "justify-end" : isSystem ? "justify-center" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[85%] rounded-3xl px-5 py-3 shadow-xl relative group",
        isUser 
          ? "bg-[#6366F1] text-white rounded-tr-none" 
          : isSystem
          ? "bg-emerald-500/5 text-emerald-500 rounded-xl border border-emerald-500/20"
          : "bg-gray-800/80 text-gray-100 rounded-tl-none border border-gray-700 backdrop-blur-sm"
      )}>
        {!isUser && !isSystem && (
          <button 
            onClick={handleCopy}
            className="absolute -right-10 top-0 p-2 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy message"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        )}

        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="relative my-4 rounded-xl overflow-hidden border border-gray-700">
                    <div className="bg-gray-900 px-4 py-1.5 text-[10px] font-bold text-gray-500 uppercase flex justify-between items-center border-b border-gray-700">
                      <span>{match[1]}</span>
                    </div>
                    <SyntaxHighlighter
                      style={atomDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '0.8rem' }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className="bg-gray-900 px-1.5 py-0.5 rounded text-[#818cf8] font-mono text-xs" {...props}>
                    {children}
                  </code>
                );
              },
              p: ({ children }) => <p className="mb-0 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="my-2 list-disc pl-4 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="my-2 list-decimal pl-4 space-y-1">{children}</ol>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, Edit, Trash2, Loader2, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MessageBubble({
  role,
  content,
  id,
  isEditing,
  isDeleted,
  timestamp,
  isLoading,
  error,
  onEdit,
  onDelete,
}: {
  role: "user" | "assistant" | "system";
  content: string;
  id: string;
  isEditing?: boolean;
  isDeleted?: boolean;
  timestamp?: number;
  isLoading?: boolean;
  error?: string;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
}) {
  const isUser = role === "user";
  const isSystem = role === "system";
  const [copied, setCopied] = useState(false);
  const [isEditingState, setIsEditingState] = useState(isEditing || false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (time?: number) => {
    if (!time) return null;
    return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn(
      "flex mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300",
      isUser ? "justify-end" : isSystem ? "justify-center" : "justify-start"
    )}>
      {isDeleted ? null : (
        <div className={cn(
          "max-w-[85%] rounded-3xl px-5 py-3 shadow-xl relative group",
          isUser
            ? "bg-[#6366F1] text-white rounded-tr-none"
            : isSystem
            ? "bg-emerald-500/5 text-emerald-500 rounded-xl border border-emerald-500/20"
            : "bg-gray-800/80 text-gray-100 rounded-tl-none border border-gray-700 backdrop-blur-sm"
        )}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="animate-spin text-gray-400" size={20} />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertTriangle className="text-red-500" size={20} />
            </div>
          )}

          {!isLoading && !error && (
            <>
              {!isUser && !isSystem && (
                <button
                  onClick={handleCopy}
                  className="absolute -right-10 top-0 p-2 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy message"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              )}

              <div className="relative">
                {isEditingState && (
                  <div className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg border border-gray-700">
                    Editing...
                  </div>
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

                {timestamp && (
                  <div className="absolute bottom-2 right-2 text-[10px] text-gray-500 font-mono">
                    {formatTime(timestamp)}
                  </div>
                )}

                {isUser && !isEditingState && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => onEdit?.(id)}
                      className="p-1 bg-gray-900/50 rounded-full hover:bg-gray-800 transition-colors"
                      title="Edit message"
                    >
                      <Edit size={14} className="text-gray-500 hover:text-white" />
                    </button>
                    <button
                      onClick={() => onDelete?.(id)}
                      className="p-1 bg-gray-900/50 rounded-full hover:bg-gray-800 transition-colors"
                      title="Delete message"
                    >
                      <Trash2 size={14} className="text-gray-500 hover:text-red-400" />
                    </button>
                  </div>
                )}
              </>
          )}
        </div>
      )}
    </div>
  );
}
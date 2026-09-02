import React from 'react';

export default function MessageBubble({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${
        isUser 
          ? "bg-[#6366F1] text-white rounded-tr-none" 
          : "bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700"
      }`}>
        <p className="text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  );
}
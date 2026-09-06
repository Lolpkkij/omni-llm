"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, Shield, Globe, Box } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 bg-[#0a0b2e] overflow-y-auto">
      {/* Hero Section */}
      <div className="max-w-4xl w-full text-center py-12">
        <div className="inline-flex items-center gap-2 bg-[#6366F1]/10 text-[#818cf8] px-4 py-2 rounded-full text-sm font-bold border border-[#6366F1]/20 mb-8 animate-bounce">
          <Sparkles size={16} /> Now with Llama 3.1 & GPT-4o
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tighter leading-[1.1]">
          The One API to Rule <br /> 
          <span className="bg-gradient-to-r from-[#6366F1] to-[#a855f7] bg-clip-text text-transparent">Every LLM</span>
        </h1>
        
        <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
          OmniLLM is a high-performance proxy gateway that unifies top-tier AI providers under a single secret key. Routing, usage tracking, and local hub — built-in.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/chat"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4f46e5] text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#6366F1]/20"
          >
            Launch Chat Studio <ArrowRight size={20} />
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all border border-gray-700"
          >
            View Dashboard
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pb-12">
        <div className="p-8 bg-gray-800/30 border border-gray-700 rounded-3xl hover:border-[#6366F1]/50 transition-all">
          <div className="w-12 h-12 bg-[#6366F1]/20 text-[#6366F1] rounded-2xl flex items-center justify-center mb-6">
            <Zap size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Auto-Routing</h3>
          <p className="text-gray-500 leading-relaxed text-sm">
            Automatically switch between free and premium models based on your request complexity and context window requirements.
          </p>
        </div>

        <div className="p-8 bg-gray-800/30 border border-gray-700 rounded-3xl hover:border-[#6366F1]/50 transition-all">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
            <Shield size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Unified Auth</h3>
          <p className="text-gray-500 leading-relaxed text-sm">
            Keep your production keys on the server. Access all providers via a single, revocable OmniLLM proxy key.
          </p>
        </div>

        <div className="p-8 bg-gray-800/30 border border-gray-700 rounded-3xl hover:border-[#6366F1]/50 transition-all">
          <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mb-6">
            <Box size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Local Hub</h3>
          <p className="text-gray-500 leading-relaxed text-sm">
            Seamlessly bridge Ollama, LM Studio, and Hugging Face local models into your workflow for maximum privacy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
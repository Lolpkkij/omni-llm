import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-gray-800/50 border border-gray-700 rounded-3xl p-8 md:p-12 text-center shadow-2xl backdrop-blur-sm">
        <div className="w-16 h-16 bg-[#6366F1]/20 text-[#6366F1] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Sparkles size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Welcome to <span className="text-[#6366F1]">OmniLLM</span>
        </h1>
        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
          Your central hub for the world's most powerful AI models. Seamlessly switch between providers and enhance your workflow.
        </p>
        <Link
          to="/chat"
          className="inline-flex items-center gap-2 bg-[#6366F1] hover:bg-[#4f46e5] text-white px-6 py-3 rounded-full font-semibold transition-all hover:scale-105 active:scale-95"
        >
          Get Started with Chat <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
};

export default Index;
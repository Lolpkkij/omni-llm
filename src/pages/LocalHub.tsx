import React from 'react';
import { Server } from 'lucide-react';

const LocalHub = () => {
  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gray-800 text-gray-400 rounded-2xl flex items-center justify-center mx-auto border border-gray-700">
          <Server size={32} />
        </div>
        <h1 className="text-3xl font-bold text-white">Local Model Hub</h1>
        <p className="text-gray-400">Local model management is coming soon!</p>
      </div>
    </div>
  );
};

export default LocalHub;
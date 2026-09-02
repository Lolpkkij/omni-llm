import React from 'react';
import { Key } from 'lucide-react';

const ApiKeys = () => {
  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gray-800 text-gray-400 rounded-2xl flex items-center justify-center mx-auto border border-gray-700">
          <Key size={32} />
        </div>
        <h1 className="text-3xl font-bold text-white">API Keys</h1>
        <p className="text-gray-400">This section is coming soon. Stay tuned!</p>
      </div>
    </div>
  );
};

export default ApiKeys;
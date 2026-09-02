"use client";

import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, Lock, CreditCard } from "lucide-react";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";

type SubscriptionModalProps = {
  open: boolean;
  onClose: () => void;
  triggerFeature?: string;
};

export default function SubscriptionModal({ open, onClose, triggerFeature }: SubscriptionModalProps) {
  const { setSubscription } = useSubscriptionStore();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In production: integrate with Stripe/Paddle/etc.
    // For demo: activate premium for 1 year
    const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
    setSubscription(true, expiresAt);
    
    setLoading(false);
    onClose();
  };

  const features = [
    { icon: Sparkles, title: "Auto [Premium] Model Selection", desc: "AI automatically picks the best model (free + paid) for each request" },
    { icon: Zap, title: "Priority Access", desc: "Faster response times and higher rate limits" },
    { icon: Lock, title: "Advanced Models", desc: "Access to GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, and more" },
    { icon: CreditCard, title: "Usage Analytics", desc: "Detailed token usage and cost tracking across all providers" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-lg rounded-3xl">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-yellow-500/20 text-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={32} />
          </div>
          <DialogTitle className="text-2xl font-bold">Unlock Premium</DialogTitle>
          <DialogDescription className="text-gray-400">
            Get access to the best AI models and automatic model routing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-xl border border-gray-700">
              <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg">
                <f.icon size={18} />
              </div>
              <div>
                <p className="font-medium">{f.title}</p>
                <p className="text-sm text-gray-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-700">
          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 hover:from-yellow-400 hover:to-orange-400 py-4 font-bold rounded-xl transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CreditCard size={20} />
                Upgrade to Premium - $19/mo
              </span>
            )}
          </Button>
          
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full mt-2 text-gray-400 hover:text-gray-200"
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
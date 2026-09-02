"use client";

import React from "react";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem, 
  SelectGroup,
  SelectLabel,
  SelectSeparator 
} from "@/components/ui/select";
import { Sparkles, Lock, Zap, CheckCircle2, Copy } from "lucide-react";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { MODEL_CATALOG } from "@/lib/modelRouter";
import { cn } from "@/lib/utils";

type ModelSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  providers: any[];
  disabled?: boolean;
};

const AUTO_FREE = "auto-free";
const AUTO_PREMIUM = "auto-premium";

export default function ModelSelector({ value, onChange, providers, disabled }: ModelSelectorProps) {
  const { checkAccess } = useSubscriptionStore();
  const hasPremiumAccess = checkAccess("auto-premium");
  const hasAnyProvider = providers.some(p => p.enabled && p.encryptedKeys?.length);

  // Get available manual models from configured providers
  const availableModels = MODEL_CATALOG.filter(m => 
    providers.some(p => p.enabled && p.encryptedKeys?.length && p.providerType === m.providerType)
  );

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || !hasAnyProvider}>
      <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white data-[placeholder]:text-gray-500">
        <SelectValue placeholder="Select model..." />
      </SelectTrigger>
      <SelectContent className="bg-gray-800 border-gray-700 text-white max-h-96">
        {/* Auto modes */}
        <SelectGroup>
          <SelectLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Automatic</SelectLabel>
          <SelectItem value={AUTO_FREE} className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-400" />
              <span>Auto [Free]</span>
            </div>
            <span className="text-xs text-green-400 font-medium">FREE</span>
          </SelectItem>
          <SelectItem 
            value={AUTO_PREMIUM} 
            disabled={!hasPremiumAccess}
            className={cn("relative flex items-center justify-between", !hasPremiumAccess && "opacity-50 cursor-not-allowed")}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>Auto [Premium]</span>
              {!hasPremiumAccess && <Lock className="w-4 h-4 text-gray-500 ml-1" />}
            </div>
            <span className="text-xs text-yellow-400 font-medium">PREMIUM</span>
          </SelectItem>
        </SelectGroup>

        {/* Manual models by provider */}
        {availableModels.length > 0 && (
          <>
            <SelectSeparator className="border-gray-700" />
            {Array.from(new Set(availableModels.map(m => m.providerType))).map(providerType => {
              const providerModels = availableModels.filter(m => m.providerType === providerType);
              return (
                <SelectGroup key={providerType}>
                  <SelectLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {providerType.charAt(0).toUpperCase() + providerType.slice(1)}
                  </SelectLabel>
                  {providerModels.map(model => (
                    <SelectItem 
                      key={model.id} 
                      value={model.id}
                      className="relative flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {model.isFree ? (
                          <span className="w-4 h-4 text-green-400">✓</span>
                        ) : (
                          <span className="w-4 h-4 text-yellow-400">$</span>
                        )}
                        <span>{model.name}</span>
                      </div>
                      {value === model.id && <CheckCircle2 className="w-4 h-4 text-[#6366F1]" />}
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })}
          </>
        )}

        {/* No providers placeholder */}
        {availableModels.length === 0 && !hasAnyProvider && (
          <SelectItem
            value="none"
            disabled
            className="text-center text-gray-500 py-4"
          >
            No providers configured. Add API keys in Providers tab.
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
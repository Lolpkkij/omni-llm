"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SettingsState {
  defaultModel: string;
  autoRoutingPreference: "performance" | "cost" | "balanced";
  compactMode: boolean;
  developerMode: boolean;
  
  setDefaultModel: (model: string) => void;
  setAutoRoutingPreference: (pref: "performance" | "cost" | "balanced") => void;
  setCompactMode: (enabled: boolean) => void;
  setDeveloperMode: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultModel: "gpt-4o-mini",
      autoRoutingPreference: "balanced",
      compactMode: false,
      developerMode: false,

      setDefaultModel: (defaultModel) => set({ defaultModel }),
      setAutoRoutingPreference: (autoRoutingPreference) => set({ autoRoutingPreference }),
      setCompactMode: (compactMode) => set({ compactMode }),
      setDeveloperMode: (developerMode) => set({ developerMode }),
    }),
    {
      name: "omni-global-settings",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
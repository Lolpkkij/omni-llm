import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SubscriptionState {
  tier: "free" | "premium";
  isActive: boolean;
  expiresAt?: number;
  setTier: (tier: "free" | "premium") => void;
  setSubscription: (active: boolean, expiresAt?: number) => void;
  checkAccess: (feature: "auto-premium") => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      tier: "free",
      isActive: false,
      expiresAt: undefined,

      setTier: (tier) => set({ tier }),
      
      setSubscription: (active, expiresAt) => set({ 
        isActive: active, 
        expiresAt,
        tier: active ? "premium" : "free"
      }),

      checkAccess: (feature) => {
        if (feature === "auto-premium") {
          const state = get();
          if (!state.isActive) return false;
          if (state.expiresAt && Date.now() > state.expiresAt) {
            // Subscription expired
            set({ isActive: false, tier: "free" });
            return false;
          }
          return true;
        }
        return true;
      },
    }),
    {
      name: "omni-subscription-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
import { create } from 'zustand';
import localforage from 'localforage';

interface UnifiedKeyState {
  unifiedKey: string;
  loading: boolean;
  loadKey: () => Promise<void>;
  generateKey: () => Promise<void>;
  refreshKey: () => Promise<void>;
}

const KEY_STORAGE_NAME = 'omni_unified_key';

export const useUnifiedKeyStore = create<UnifiedKeyState>((set, get) => ({
  unifiedKey: '',
  loading: false,

  loadKey: async () => {
    set({ loading: true });
    try {
      const key = await localforage.getItem<string>(KEY_STORAGE_NAME);
      if (key) {
        set({ unifiedKey: key });
      } else {
        await get().generateKey();
      }
    } catch (e) {
      console.error('Failed to load unified key', e);
    } finally {
      set({ loading: false });
    }
  },

  generateKey: async () => {
    set({ loading: true });
    try {
      const randomStr = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
      const newKey = `omni-proxy-${randomStr}`;
      
      await localforage.setItem(KEY_STORAGE_NAME, newKey);
      set({ unifiedKey: newKey });
    } catch (e) {
      console.error('Failed to generate unified key', e);
    } finally {
      set({ loading: false });
    }
  },

  refreshKey: async () => {
    await get().generateKey();
  },
}));
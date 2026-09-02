import { create } from 'zustand';
import localforage from 'localforage';
import CryptoJS from 'crypto-js';

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
      const encrypted = await localforage.getItem<string>(KEY_STORAGE_NAME);
      if (encrypted) {
        const salt = process.env.NEXT_PUBLIC_ENCRYPTION_SALT || '';
        const bytes = CryptoJS.AES.decrypt(encrypted, salt);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        set({ unifiedKey: decrypted });
      } else {
        // Generate one if it doesn't exist
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
      
      const salt = process.env.NEXT_PUBLIC_ENCRYPTION_SALT || '';
      const encrypted = CryptoJS.AES.encrypt(newKey, salt).toString();
      
      await localforage.setItem(KEY_STORAGE_NAME, encrypted);
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
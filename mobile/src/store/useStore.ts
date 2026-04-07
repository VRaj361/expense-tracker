import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearStoredTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredTokens,
} from '../storage/tokenStorage';
import type { User } from '../types';

interface AppState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  theme: 'light' | 'dark';
  isReady: boolean;

  setUser: (user: User | null) => void;
  setTokens: (token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setReady: (ready: boolean) => void;
  loadTokens: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      theme: 'light',
      isReady: false,

      setUser: (user) => set({ user }),

      setTokens: async (token, refreshToken) => {
        await setStoredTokens(token, refreshToken);
        set({ token, refreshToken });
      },

      logout: async () => {
        await clearStoredTokens();
        set({ user: null, token: null, refreshToken: null });
      },

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),

      setTheme: (theme) => set({ theme }),

      setReady: (ready) => set({ isReady: ready }),

      loadTokens: async () => {
        try {
          const [token, refreshToken] = await Promise.all([
            getStoredAccessToken(),
            getStoredRefreshToken(),
          ]);
          set({ token, refreshToken });
        } catch {
          set({ token: null, refreshToken: null });
        }
      },
    }),
    {
      name: 'fintrack-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
      }),
    },
  ),
);

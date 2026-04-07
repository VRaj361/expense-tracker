import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AppState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  theme: 'light' | 'dark';
  sidebarOpen: boolean;

  setUser: (user: User | null) => void;
  setTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      theme: 'light',
      sidebarOpen: true,

      setUser: (user) => set({ user }),

      setTokens: (token, refreshToken) => {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        set({ token, refreshToken });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({ user: null, token: null, refreshToken: null });
      },

      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
          return { theme: newTheme };
        }),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'expense-tracker-store',
      partialize: (state) => ({
        theme: state.theme,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);

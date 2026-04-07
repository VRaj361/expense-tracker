import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { authAPI } from '../services/api';

export function useAuth() {
  const { user, token, setUser, logout, isReady, setReady, loadTokens } = useStore();

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await loadTokens();
        const currentToken = useStore.getState().token;
        if (currentToken) {
          try {
            const { data } = await authAPI.getMe();
            if (!cancelled) setUser(data);
          } catch {
            if (!cancelled) await logout();
          }
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isReady,
    logout,
  };
}

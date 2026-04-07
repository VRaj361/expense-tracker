import { useLayoutEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useStore } from '../../store/useStore';

/** Tailwind `lg` — keep desktop sidebar default; mobile drawer starts closed after login. */
const LG_MIN_PX = 1024;

export function AppLayout() {
  const { token, setSidebarOpen } = useStore();

  useLayoutEffect(() => {
    if (!token || typeof window === 'undefined') return;
    if (window.innerWidth < LG_MIN_PX) {
      setSidebarOpen(false);
    }
  }, [token, setSidebarOpen]);

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { Bell, Menu, Moon, Sun, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { useStore } from '../../store/useStore';
import { notificationAPI } from '../../services/api';

export function Header() {
  const { user, theme, toggleTheme, setSidebarOpen, sidebarOpen } = useStore();
  const navigate = useNavigate();
  const prevCountRef = useRef<number>(0);

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['notifications-count'],
    queryFn: () => notificationAPI.getUnreadCount().then((r) => r.data),
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (unreadCount > prevCountRef.current && prevCountRef.current !== 0) {
      const diff = unreadCount - prevCountRef.current;
      toast.info(
        `${diff} new notification${diff > 1 ? 's' : ''}`,
        {
          duration: 4000,
          action: {
            label: 'View',
            onClick: () => navigate('/notifications'),
          },
        },
      );
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount, navigate]);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--background))]/60">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-[hsl(var(--accent))] lg:hidden cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold hidden sm:block">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => navigate('/expenses?add=true')} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </Button>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-[hsl(var(--accent))] cursor-pointer">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-lg hover:bg-[hsl(var(--accent))] cursor-pointer"
          >
            <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-[wiggle_0.5s_ease-in-out]' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[hsl(var(--destructive))] text-[10px] font-bold text-white flex items-center justify-center animate-[pulse_2s_ease-in-out_infinite]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {user?.avatar && (
            <img
              src={user.avatar}
              alt={user.name}
              onClick={() => navigate('/settings')}
              className="h-8 w-8 rounded-full border-2 border-[hsl(var(--border))] cursor-pointer hover:ring-2 hover:ring-[hsl(var(--primary))] transition-all"
            />
          )}
        </div>
      </div>
    </header>
  );
}

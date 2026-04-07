import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { EmptyState } from '../components/ui/empty-state';
import { notificationAPI } from '../services/api';
import type { AppNotification } from '../types';
import { formatDate } from '../utils/cn';

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.getAll().then((r) => r.data),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationAPI.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationAPI.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const deleteNotif = useMutation({
    mutationFn: (id: string) => notificationAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const typeBadge = (type: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'warning' | 'destructive' | 'success' | 'secondary' }> = {
      budget_alert: { label: 'Budget', variant: 'warning' },
      bill_reminder: { label: 'Reminder', variant: 'default' },
      emi_reminder: { label: 'EMI', variant: 'destructive' },
      automation: { label: 'Auto', variant: 'secondary' },
      report: { label: 'Report', variant: 'success' },
      system: { label: 'System', variant: 'secondary' },
    };
    const config = map[type] || { label: type, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) return <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-[hsl(var(--muted))]" />)}</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => markAllRead.mutate()} className="gap-1.5">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>
      {notifications.length === 0 ? (
        <EmptyState icon={<Bell className="h-12 w-12" />} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {(notifications as AppNotification[]).map((n) => (
            <Card key={n._id} className={n.isRead ? 'opacity-60' : ''}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {typeBadge(n.type)}
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatDate(n.createdAt)}</span>
                  </div>
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] truncate">{n.message}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!n.isRead && (
                    <button onClick={() => markRead.mutate(n._id)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] cursor-pointer">
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => deleteNotif.mutate(n._id)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--destructive))] cursor-pointer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

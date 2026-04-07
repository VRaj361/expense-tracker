import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVisiblePollInterval } from '../hooks/useVisiblePollInterval';
import { useLongPress } from '../hooks/useLongPress';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { EmptyState } from '../components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { notificationAPI } from '../services/api';
import type { AppNotification } from '../types';
import { formatDate } from '../utils/cn';

function typeBadgeEl(type: string) {
  const map: Record<string, { label: string; variant: 'default' | 'warning' | 'destructive' | 'success' | 'secondary' }> = {
    budget_alert: { label: 'Budget', variant: 'warning' },
    bill_reminder: { label: 'Reminder', variant: 'default' },
    emi_reminder: { label: 'EMI', variant: 'destructive' },
    automation: { label: 'Auto', variant: 'secondary' },
    report: { label: 'Report', variant: 'success' },
    system: { label: 'System', variant: 'secondary' },
    shared_wallet: { label: 'Shared wallet', variant: 'secondary' },
  };
  const config = map[type] || { label: type.replace(/_/g, ' '), variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function NotificationRow({
  n,
  onOpenDetail,
  onMarkRead,
  onDelete,
}: {
  n: AppNotification;
  onOpenDetail: (n: AppNotification) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const longPress = useLongPress(() => onOpenDetail(n));

  return (
    <Card
      className={`select-none touch-pan-y ${n.isRead ? 'opacity-60' : ''}`}
      title="Press and hold to read the full message"
    >
      <CardContent
        className="flex items-start gap-3 p-4"
        {...longPress}
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {typeBadgeEl(n.type)}
            <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatDate(n.createdAt)}</span>
          </div>
          <p className="text-sm font-medium">{n.title}</p>
          <p className="line-clamp-2 text-sm text-[hsl(var(--muted-foreground))] sm:line-clamp-3">{n.message}</p>
          <p className="mt-1.5 text-[10px] text-[hsl(var(--muted-foreground))] sm:hidden">
            Hold card to read full text
          </p>
        </div>
        <div className="flex shrink-0 gap-1" onPointerDown={(e) => e.stopPropagation()}>
          {!n.isRead && (
            <button
              type="button"
              onClick={() => onMarkRead(n._id)}
              className="cursor-pointer rounded-lg p-1.5 hover:bg-[hsl(var(--accent))]"
              aria-label="Mark as read"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(n._id)}
            className="cursor-pointer rounded-lg p-1.5 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--accent))]"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const listPollMs = useVisiblePollInterval(120_000);
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.getAll().then((r) => r.data),
    refetchInterval: listPollMs,
    refetchOnWindowFocus: true,
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

  const [detailNotif, setDetailNotif] = useState<AppNotification | null>(null);

  if (isLoading) return <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-[hsl(var(--muted))]" />)}</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => markAllRead.mutate()} className="gap-1.5 shrink-0">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>
      <p className="text-xs text-[hsl(var(--muted-foreground))] lg:hidden">
        Press and hold a notification to open the full message.
      </p>
      {notifications.length === 0 ? (
        <EmptyState icon={<Bell className="h-12 w-12" />} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {(notifications as AppNotification[]).map((n) => (
            <NotificationRow
              key={n._id}
              n={n}
              onOpenDetail={setDetailNotif}
              onMarkRead={(id) => markRead.mutate(id)}
              onDelete={(id) => deleteNotif.mutate(id)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!detailNotif} onOpenChange={(open) => !open && setDetailNotif(null)}>
        <DialogContent
          className="max-h-[85vh] gap-0 border-[hsl(var(--border))] p-0 duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.97] data-[state=open]:zoom-in-[0.97] data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:slide-in-from-bottom-4 sm:rounded-xl"
        >
          {detailNotif && (
            <>
              <DialogHeader className="space-y-3 border-b border-[hsl(var(--border))] p-5 pb-4 text-left">
                <div className="flex flex-wrap items-center gap-2 pr-8">
                  {typeBadgeEl(detailNotif.type)}
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {formatDate(detailNotif.createdAt)}
                  </span>
                </div>
                <DialogTitle className="text-left text-lg leading-snug">{detailNotif.title}</DialogTitle>
              </DialogHeader>
              <div className="max-h-[50vh] overflow-y-auto px-5 py-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[hsl(var(--foreground))]">
                  {detailNotif.message}
                </p>
              </div>
              <DialogFooter className="border-t border-[hsl(var(--border))] p-4 sm:justify-between">
                {!detailNotif.isRead && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      markRead.mutate(detailNotif._id);
                      setDetailNotif(null);
                    }}
                  >
                    <Check className="mr-1.5 h-4 w-4" /> Mark read
                  </Button>
                )}
                <Button variant="outline" size="sm" className="w-full sm:ml-auto sm:w-auto" onClick={() => setDetailNotif(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Bell, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { EmptyState } from '../components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { reminderAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/cn';
import type { Reminder } from '../types';

const reminderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  dueDate: z.string().min(1, 'Due date is required'),
  frequency: z.string().default('monthly'),
  notifyVia: z.array(z.string()).default(['inApp']),
});

type ReminderForm = z.infer<typeof reminderSchema>;

export function RemindersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReminderForm>({
    resolver: zodResolver(reminderSchema) as Resolver<ReminderForm>,
    defaultValues: {
      title: '', description: '', amount: '' as any, dueDate: '', frequency: 'monthly', notifyVia: ['inApp'],
    },
  });

  const { data: reminders = [], isLoading } = useQuery<Reminder[]>({
    queryKey: ['reminders'],
    queryFn: () => reminderAPI.getAll().then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: (data: any) => reminderAPI.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reminders'] }); toast.success('Reminder created'); setDialogOpen(false); reset(); },
  });

  const markPaid = useMutation({
    mutationFn: (id: string) => reminderAPI.markPaid(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reminders'] }); toast.success('Marked as paid'); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => reminderAPI.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reminders'] }); toast.success('Deleted'); },
  });

  const upcoming = reminders.filter(r => !r.isPaid);
  const paid = reminders.filter(r => r.isPaid);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reminders</h1>
        <Button onClick={() => setDialogOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> Add</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-[hsl(var(--muted))] animate-pulse" />)}</div>
      ) : reminders.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-12 w-12" />}
          title="No reminders"
          description="Add bill payment reminders to never miss a due date."
          action={<Button onClick={() => setDialogOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> Add</Button>}
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] mb-2 uppercase tracking-wide">Upcoming</h2>
              <div className="space-y-2">
                {upcoming.map((r) => {
                  const isOverdue = new Date(r.dueDate) < new Date();
                  return (
                    <Card key={r._id} className={isOverdue ? 'border-red-300 dark:border-red-800' : ''}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isOverdue ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                          <Clock className={`h-5 w-5 ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{r.title}</p>
                            <Badge variant={isOverdue ? 'destructive' : 'warning'} className="text-[10px]">
                              {isOverdue ? 'Overdue' : 'Due ' + formatDate(r.dueDate)}
                            </Badge>
                          </div>
                          {r.description && <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{r.description}</p>}
                        </div>
                        <p className="text-sm font-bold">{formatCurrency(r.amount)}</p>
                        <div className="flex gap-1">
                          <button onClick={() => markPaid.mutate(r._id)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-emerald-600 cursor-pointer">
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => remove.mutate(r._id)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--destructive))] cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
          {paid.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] mb-2 uppercase tracking-wide">Paid</h2>
              <div className="space-y-2">
                {paid.map((r) => (
                  <Card key={r._id} className="opacity-50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      <div className="flex-1"><p className="text-sm">{r.title}</p></div>
                      <p className="text-sm">{formatCurrency(r.amount)}</p>
                      <button onClick={() => remove.mutate(r._id)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--destructive))] cursor-pointer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Reminder</DialogTitle>
            <DialogDescription>Never miss a bill payment again.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => create.mutate(d))} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title *</label>
              <Input placeholder="e.g. Electricity Bill, Netflix" {...register('title')} />
              {errors.title && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea placeholder="Any additional details (optional)" {...register('description')} rows={2} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
              <div className="min-w-0">
                <label className="text-sm font-medium mb-1.5 block">Amount *</label>
                <Input type="number" placeholder="1500" {...register('amount', { valueAsNumber: true })} />
                {errors.amount && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.amount.message}</p>}
              </div>
              <div className="min-w-0">
                <label className="text-sm font-medium mb-1.5 block">Due Date *</label>
                <Input type="date" {...register('dueDate')} />
                {errors.dueDate && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.dueDate.message}</p>}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Frequency</label>
              <Select
                options={[
                  { value: 'once', label: 'Once' }, { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' },
                  { value: 'yearly', label: 'Yearly' },
                ]}
                {...register('frequency')}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

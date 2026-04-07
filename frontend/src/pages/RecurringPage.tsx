import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, RefreshCw, Trash2, Pause, Play } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select } from '../components/ui/select';
import { EmptyState } from '../components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { recurringAPI, categoryAPI } from '../services/api';
import { formatCurrency, formatDate, PAYMENT_METHODS } from '../utils/cn';
import type { RecurringExpense, Category } from '../types';

const recurringSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  type: z.string().default('expense'),
  categoryName: z.string().optional(),
  description: z.string().optional(),
  frequency: z.string().default('monthly'),
  paymentMethod: z.string().optional(),
  vendor: z.string().optional(),
  nextDueDate: z.string().min(1, 'Next due date is required'),
});

type RecurringForm = z.input<typeof recurringSchema>;

export function RecurringPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<RecurringForm>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      amount: '' as any, type: 'expense', categoryName: '', description: '', frequency: 'monthly',
      paymentMethod: '', vendor: '', nextDueDate: new Date().toISOString().split('T')[0],
    },
  });

  const { data: items = [], isLoading } = useQuery<RecurringExpense[]>({
    queryKey: ['recurring'],
    queryFn: () => recurringAPI.getAll().then((r) => r.data),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll().then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: (data: any) => recurringAPI.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['recurring'] }); toast.success('Recurring item added'); setDialogOpen(false); reset(); },
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => recurringAPI.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => recurringAPI.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['recurring'] }); toast.success('Deleted'); },
  });

  const selectedType = watch('type');
  const filteredCategories = categories.filter(c => c.type === selectedType || c.type === 'both');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recurring</h1>
        <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-[hsl(var(--muted))] animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<RefreshCw className="h-12 w-12" />}
          title="No recurring items"
          description="Add subscriptions, rent, or regular bills."
          action={<Button onClick={() => setDialogOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> Add</Button>}
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item._id} className={!item.isActive ? 'opacity-50' : ''}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-sm truncate">{item.description || item.categoryName || item.vendor}</p>
                    <Badge variant="secondary" className="text-[10px] capitalize">{item.frequency}</Badge>
                    <Badge variant={item.type === 'income' ? 'success' : 'outline'} className="text-[10px]">{item.type}</Badge>
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Next: {formatDate(item.nextDueDate)}</p>
                </div>
                <p className="text-sm font-bold">{formatCurrency(item.amount)}</p>
                <div className="flex gap-1">
                  <button onClick={() => toggle.mutate({ id: item._id, isActive: !item.isActive })} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] cursor-pointer">
                    {item.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button onClick={() => remove.mutate(item._id)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--destructive))] cursor-pointer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Recurring</DialogTitle>
            <DialogDescription>Set up an automatic recurring transaction.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => create.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={selectedType === 'expense' ? 'default' : 'outline'} onClick={() => setValue('type', 'expense')}>Expense</Button>
              <Button type="button" variant={selectedType === 'income' ? 'success' : 'outline'} onClick={() => setValue('type', 'income')}>Income</Button>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Amount *</label>
              <Input type="number" placeholder="5000" {...register('amount')} />
              {errors.amount && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Category</label>
              <Select options={filteredCategories.map(c => ({ value: c.name, label: c.name }))} placeholder="Select category" {...register('categoryName')} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Input placeholder="e.g. Netflix, Rent, Salary" {...register('description')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Frequency</label>
                <Select
                  options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]}
                  {...register('frequency')}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Next Due Date</label>
                <Input type="date" {...register('nextDueDate')} />
                {errors.nextDueDate && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.nextDueDate.message}</p>}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Payment Method</label>
              <Select options={PAYMENT_METHODS.map(p => ({ value: p.value, label: p.label }))} placeholder="Select method" {...register('paymentMethod')} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Add</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

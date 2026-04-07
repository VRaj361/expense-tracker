import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, PiggyBank, Trash2, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Select } from '../components/ui/select';
import { EmptyState } from '../components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { budgetAPI, categoryAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/cn';
import type { Budget, Category } from '../types';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const budgetSchema = z.object({
  categoryName: z.string().optional(),
  limit: z.coerce.number().positive('Budget limit must be greater than 0'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
}).refine((d) => !d.startDate || !d.endDate || new Date(d.endDate) >= new Date(d.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

type BudgetForm = z.infer<typeof budgetSchema>;

function getPresetDates(preset: string) {
  const now = new Date();
  switch (preset) {
    case 'this-month':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
      };
    case 'next-month':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split('T')[0],
      };
    case 'this-quarter': {
      const qStart = Math.floor(now.getMonth() / 3) * 3;
      return {
        startDate: new Date(now.getFullYear(), qStart, 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), qStart + 3, 0).toISOString().split('T')[0],
      };
    }
    case 'this-year':
      return {
        startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0],
      };
    default:
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
      };
  }
}

export function BudgetsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const defaults = getPresetDates('this-month');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema) as Resolver<BudgetForm>,
    defaultValues: { categoryName: '', limit: '' as any, startDate: defaults.startDate, endDate: defaults.endDate },
  });

  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ['budgets'],
    queryFn: () => budgetAPI.getAll().then((r) => r.data),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll().then((r) => r.data),
  });

  const createBudget = useMutation({
    mutationFn: (data: any) => budgetAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget created');
      setDialogOpen(false);
      reset();
    },
  });

  const deleteBudget = useMutation({
    mutationFn: (id: string) => budgetAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget deleted');
    },
  });

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return 'bg-red-500';
    if (pct >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const applyPreset = (preset: string) => {
    const dates = getPresetDates(preset);
    setValue('startDate', dates.startDate);
    setValue('endDate', dates.endDate);
  };

  const now = new Date();
  const activeBudgets = budgets.filter(b => new Date(b.endDate) >= now);
  const pastBudgets = budgets.filter(b => new Date(b.endDate) < now);
  const totalBudget = activeBudgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = activeBudgets.reduce((s, b) => s + (b.spent || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <Button onClick={() => { reset({ categoryName: '', limit: '' as any, ...getPresetDates('this-month') }); setDialogOpen(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Budget
        </Button>
      </div>

      {totalBudget > 0 && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
          <CardContent className="p-5">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Active Budgets Total</span>
              <span className="text-sm font-bold">{formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}</span>
            </div>
            <Progress value={Math.min(100, (totalSpent / totalBudget) * 100)} indicatorClassName={getProgressColor((totalSpent / totalBudget) * 100)} />
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 rounded-xl bg-[hsl(var(--muted))] animate-pulse" />)}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={<PiggyBank className="h-12 w-12" />}
          title="No budgets set"
          description="Create budgets to track your spending limits by custom date ranges."
          action={<Button onClick={() => setDialogOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> Create Budget</Button>}
        />
      ) : (
        <>
          {activeBudgets.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] mb-2 uppercase tracking-wide">Active</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeBudgets.map((budget) => {
                  const pct = budget.percentage || Math.min(100, Math.round(((budget.spent || 0) / budget.limit) * 100));
                  return (
                    <Card key={budget._id}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold">{budget.categoryName || 'Overall'}</p>
                            <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                              <Calendar className="h-3 w-3" />
                              {formatDate(budget.startDate)} — {formatDate(budget.endDate)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={pct >= 100 ? 'destructive' : pct >= 80 ? 'warning' : 'success'}>
                              {pct}%
                            </Badge>
                            <button onClick={() => deleteBudget.mutate(budget._id)} className="p-1 rounded cursor-pointer text-[hsl(var(--destructive))] hover:bg-[hsl(var(--accent))]">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <Progress value={pct} indicatorClassName={getProgressColor(pct)} className="mb-2" />
                        <div className="flex justify-between text-sm">
                          <span className="text-[hsl(var(--muted-foreground))]">Spent: {formatCurrency(budget.spent || 0)}</span>
                          <span className="font-medium">Limit: {formatCurrency(budget.limit)}</span>
                        </div>
                        {pct >= 80 && pct < 100 && <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Approaching budget limit!</p>}
                        {pct >= 100 && <p className="text-xs text-red-600 dark:text-red-400 mt-2">Budget exceeded!</p>}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
          {pastBudgets.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] mb-2 uppercase tracking-wide">Past</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastBudgets.map((budget) => {
                  const pct = budget.percentage || Math.min(100, Math.round(((budget.spent || 0) / budget.limit) * 100));
                  return (
                    <Card key={budget._id} className="opacity-60">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm">{budget.categoryName || 'Overall'}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatDate(budget.startDate)} — {formatDate(budget.endDate)}</p>
                          </div>
                          <Badge variant={pct >= 100 ? 'destructive' : 'secondary'}>{pct}% used</Badge>
                        </div>
                        <Progress value={pct} indicatorClassName={getProgressColor(pct)} className="mb-1" />
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatCurrency(budget.spent || 0)} / {formatCurrency(budget.limit)}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Budget</DialogTitle>
            <DialogDescription>Set a spending limit for a custom time period.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createBudget.mutate(d))} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Category</label>
              <Select
                options={categories.filter(c => c.type !== 'income').map(c => ({ value: c.name, label: c.name }))}
                placeholder="Overall (all categories)"
                {...register('categoryName')}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Budget Limit *</label>
              <Input type="number" placeholder="5000" {...register('limit', { valueAsNumber: true })} />
              {errors.limit && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.limit.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Quick Presets</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'This Month', value: 'this-month' },
                  { label: 'Next Month', value: 'next-month' },
                  { label: 'This Quarter', value: 'this-quarter' },
                  { label: 'This Year', value: 'this-year' },
                ].map((p) => (
                  <Button key={p.value} type="button" variant="outline" size="sm" onClick={() => applyPreset(p.value)}>
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
              <div className="min-w-0">
                <label className="text-sm font-medium mb-1.5 block">Start Date *</label>
                <Input type="date" {...register('startDate')} />
                {errors.startDate && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.startDate.message}</p>}
              </div>
              <div className="min-w-0">
                <label className="text-sm font-medium mb-1.5 block">End Date *</label>
                <Input type="date" {...register('endDate')} />
                {errors.endDate && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.endDate.message}</p>}
              </div>
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

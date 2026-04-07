import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, TrendingUp, TrendingDown, Trash2, Edit2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select } from '../components/ui/select';
import { EmptyState } from '../components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { investmentAPI } from '../services/api';
import { formatCurrency } from '../utils/cn';
import type { Investment } from '../types';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
const TYPE_LABELS: Record<string, string> = {
  stocks: 'Stocks', mutual_funds: 'Mutual Funds', crypto: 'Crypto',
  fixed_deposit: 'Fixed Deposit', other: 'Other',
};

const investmentSchema = z.object({
  name: z.string().min(1, 'Investment name is required'),
  type: z.string().default('stocks'),
  investedAmount: z.coerce.number().positive('Invested amount must be greater than 0'),
  currentValue: z.coerce.number().min(0, 'Current value cannot be negative'),
  units: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

type InvestmentForm = z.infer<typeof investmentSchema>;

export function InvestmentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<InvestmentForm>({
    resolver: zodResolver(investmentSchema) as Resolver<InvestmentForm>,
    defaultValues: { name: '', type: 'stocks', investedAmount: '' as any, currentValue: '' as any, units: '' as any, notes: '' },
  });

  const { data: investments = [], isLoading } = useQuery<Investment[]>({
    queryKey: ['investments'],
    queryFn: () => investmentAPI.getAll().then((r) => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['investment-summary'],
    queryFn: () => investmentAPI.getSummary().then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: (data: any) => editingId ? investmentAPI.update(editingId, data) : investmentAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investment-summary'] });
      toast.success(editingId ? 'Updated' : 'Investment added');
      setDialogOpen(false); setEditingId(null); reset();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => investmentAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investment-summary'] });
      toast.success('Deleted');
    },
  });

  const openEdit = (inv: Investment) => {
    setEditingId(inv._id);
    reset({ name: inv.name, type: inv.type, investedAmount: inv.investedAmount, currentValue: inv.currentValue, units: inv.units || 0, notes: inv.notes || '' });
    setDialogOpen(true);
  };

  const pieData = summary?.byType ? Object.entries(summary.byType).map(([type, data]: any) => ({
    name: TYPE_LABELS[type] || type, value: data.current,
  })) : [];

  const profitLoss = summary?.profitLoss || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Investments</h1>
        <Button onClick={() => { setEditingId(null); reset(); setDialogOpen(true); }} className="gap-1.5"><Plus className="h-4 w-4" /> Add</Button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Invested</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalInvested)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Current Value</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.currentValue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Profit / Loss</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
                </p>
                {profitLoss >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-500" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{summary.profitLossPercentage}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {pieData.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Portfolio Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: unknown) => formatCurrency(Number(v) || 0)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-[hsl(var(--muted))] animate-pulse" />)}</div>
      ) : investments.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="h-12 w-12" />}
          title="No investments"
          description="Track your investment portfolio."
          action={<Button onClick={() => setDialogOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> Add</Button>}
        />
      ) : (
        <div className="space-y-2">
          {investments.map((inv) => {
            const pl = inv.currentValue - inv.investedAmount;
            return (
              <Card key={inv._id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{inv.name}</p>
                      <Badge variant="secondary" className="text-[10px]">{TYPE_LABELS[inv.type]}</Badge>
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Invested: {formatCurrency(inv.investedAmount)}
                      {inv.units ? ` · ${inv.units} units` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(inv.currentValue)}</p>
                    <p className={`text-xs ${pl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {pl >= 0 ? '+' : ''}{formatCurrency(pl)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(inv)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] cursor-pointer"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => remove.mutate(inv._id)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--destructive))] cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Investment' : 'Add Investment'}</DialogTitle>
            <DialogDescription>Track your investment portfolio.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => create.mutate(d))} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Investment Name *</label>
              <Input placeholder="e.g. Reliance Industries, SBI Bluechip" {...register('name')} />
              {errors.name && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type</label>
              <Select options={Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))} {...register('type')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Invested Amount *</label>
                <Input type="number" placeholder="50000" {...register('investedAmount', { valueAsNumber: true })} />
                {errors.investedAmount && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.investedAmount.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Current Value *</label>
                <Input type="number" placeholder="55000" {...register('currentValue', { valueAsNumber: true })} />
                {errors.currentValue && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.currentValue.message}</p>}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Units (optional)</label>
              <Input type="number" placeholder="100" {...register('units', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Notes</label>
              <Input placeholder="Any additional notes" {...register('notes')} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditingId(null); }}>Cancel</Button>
              <Button type="submit">{editingId ? 'Update' : 'Add'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

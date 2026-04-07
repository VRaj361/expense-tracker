import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, CreditCard, Trash2, ChevronRight, DollarSign, Banknote, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Select } from '../components/ui/select';
import { EmptyState } from '../components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { loanAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/cn';
import type { Loan } from '../types';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loanSchema = z.object({
  name: z.string().min(1, 'Loan name is required'),
  loanType: z.string().default('personal'),
  loanAmount: z.coerce.number().positive('Loan amount must be greater than 0'),
  interestRate: z.coerce.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100%'),
  emiAmount: z.coerce.number().positive('EMI amount must be greater than 0'),
  tenure: z.coerce.number().int('Tenure must be a whole number').positive('Tenure must be at least 1 month'),
  startDate: z.string().min(1, 'Start date is required'),
  emiDay: z.coerce.number().int().min(1, 'Day must be 1-28').max(28, 'Day must be 1-28'),
  autoDeduct: z.boolean().default(false),
});

type LoanForm = z.infer<typeof loanSchema>;

export function LoansPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scheduleDialog, setScheduleDialog] = useState<string | null>(null);
  const [extraPayDialog, setExtraPayDialog] = useState<string | null>(null);
  const [extraAmount, setExtraAmount] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LoanForm>({
    resolver: zodResolver(loanSchema) as Resolver<LoanForm>,
    defaultValues: {
      name: '', loanAmount: '' as any, interestRate: '' as any, emiAmount: '' as any, tenure: '' as any,
      startDate: new Date().toISOString().split('T')[0], loanType: 'personal',
      emiDay: 5, autoDeduct: false,
    },
  });

  const { data: loans = [], isLoading } = useQuery<Loan[]>({
    queryKey: ['loans'],
    queryFn: () => loanAPI.getAll().then((r) => r.data),
  });

  const { data: scheduleData } = useQuery({
    queryKey: ['loan-schedule', scheduleDialog],
    queryFn: () => scheduleDialog ? loanAPI.getSchedule(scheduleDialog).then((r) => r.data) : null,
    enabled: !!scheduleDialog,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['loans'] });

  const create = useMutation({
    mutationFn: (data: any) => loanAPI.create(data),
    onSuccess: () => { invalidate(); toast.success('Loan added'); setDialogOpen(false); reset(); },
  });

  const pay = useMutation({
    mutationFn: (id: string) => loanAPI.recordPayment(id),
    onSuccess: () => { invalidate(); toast.success('EMI payment recorded'); },
  });

  const extraPay = useMutation({
    mutationFn: ({ id, amount, note }: { id: string; amount: number; note: string }) =>
      loanAPI.extraPayment(id, amount, note),
    onSuccess: () => {
      invalidate();
      toast.success('Extra payment recorded');
      setExtraPayDialog(null);
      setExtraAmount('');
      setExtraNote('');
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => loanAPI.delete(id),
    onSuccess: () => { invalidate(); toast.success('Deleted'); },
  });

  const totalDebt = loans.filter(l => l.isActive).reduce((s, l) => s + (l.remainingBalance || 0), 0);
  const monthlyEmi = loans.filter(l => l.isActive).reduce((s, l) => s + l.emiAmount, 0);
  const totalExtraPaid = loans.reduce((s, l) => s + (l.extraPaid || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Loans & EMI</h1>
        <Button onClick={() => setDialogOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> Add Loan</Button>
      </div>

      {loans.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Outstanding</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalDebt)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Monthly EMI Total</p>
              <p className="text-2xl font-bold">{formatCurrency(monthlyEmi)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Extra Paid</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalExtraPaid)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-32 rounded-xl bg-[hsl(var(--muted))] animate-pulse" />)}</div>
      ) : loans.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-12 w-12" />}
          title="No loans"
          description="Track your loans, EMI auto-deductions, and extra payments."
          action={<Button onClick={() => setDialogOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> Add Loan</Button>}
        />
      ) : (
        <div className="space-y-3">
          {loans.map((loan) => {
            const progress = loan.tenure > 0 ? Math.round((loan.paidEmis / loan.tenure) * 100) : 0;
            return (
              <Card key={loan._id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{loan.name}</p>
                        <Badge variant={loan.isActive ? 'default' : 'secondary'} className="text-[10px] capitalize">{loan.loanType}</Badge>
                        {loan.autoDeduct && <Badge variant="success" className="text-[10px]">Auto EMI</Badge>}
                      </div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        EMI: {formatCurrency(loan.emiAmount)} · {loan.interestRate}% p.a.
                        {loan.nextEmiDate && ` · Next: ${formatDate(loan.nextEmiDate)}`}
                      </p>
                      {(loan.extraPaid || 0) > 0 && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          Extra paid: {formatCurrency(loan.extraPaid)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(loan.remainingBalance || 0)}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">remaining</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Progress value={progress} className="flex-1" />
                    <span className="text-xs font-medium">{loan.paidEmis}/{loan.tenure}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {loan.isActive && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => pay.mutate(loan._id)} className="gap-1">
                          <DollarSign className="h-3.5 w-3.5" /> Record EMI
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setExtraPayDialog(loan._id)} className="gap-1">
                          <Banknote className="h-3.5 w-3.5" /> Extra Payment
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setScheduleDialog(loan._id)} className="gap-1">
                      <ChevronRight className="h-3.5 w-3.5" /> Schedule
                    </Button>
                    {loan.payments?.length > 0 && (
                      <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1 ml-auto">
                        <Clock className="h-3 w-3" />
                        Last: {formatDate(loan.payments[loan.payments.length - 1].date)} — {loan.payments[loan.payments.length - 1].note}
                      </span>
                    )}
                    <button onClick={() => remove.mutate(loan._id)} className="ml-auto p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--destructive))] cursor-pointer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Loan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Loan</DialogTitle>
            <DialogDescription>Track your loan with optional auto EMI deduction.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => create.mutate(d))} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Loan Name *</label>
              <Input placeholder="e.g. Home Loan, Car Loan" {...register('name')} />
              {errors.name && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Loan Type</label>
              <Select
                options={[
                  { value: 'home', label: 'Home' }, { value: 'car', label: 'Car' },
                  { value: 'personal', label: 'Personal' }, { value: 'education', label: 'Education' },
                  { value: 'credit_card', label: 'Credit Card' }, { value: 'other', label: 'Other' },
                ]}
                {...register('loanType')}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Loan Amount *</label>
                <Input type="number" placeholder="500000" {...register('loanAmount', { valueAsNumber: true })} />
                {errors.loanAmount && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.loanAmount.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Interest Rate (%) *</label>
                <Input type="number" step="0.01" placeholder="8.5" {...register('interestRate', { valueAsNumber: true })} />
                {errors.interestRate && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.interestRate.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">EMI Amount *</label>
                <Input type="number" placeholder="12000" {...register('emiAmount', { valueAsNumber: true })} />
                {errors.emiAmount && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.emiAmount.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tenure (months) *</label>
                <Input type="number" placeholder="60" {...register('tenure', { valueAsNumber: true })} />
                {errors.tenure && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.tenure.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Start Date</label>
                <Input type="date" {...register('startDate')} />
                {errors.startDate && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.startDate.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">EMI Deduction Day *</label>
                <Input type="number" min={1} max={28} placeholder="5" {...register('emiDay', { valueAsNumber: true })} />
                {errors.emiDay && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.emiDay.message}</p>}
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">Day of month (1-28)</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[hsl(var(--accent))]/50">
              <input type="checkbox" id="autoDeduct" {...register('autoDeduct')} className="rounded" />
              <label htmlFor="autoDeduct" className="text-sm">
                <span className="font-medium">Enable Auto EMI Deduction</span>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Automatically records EMI payment every month on the deduction day</p>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Add</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Extra Payment Dialog */}
      <Dialog open={!!extraPayDialog} onOpenChange={() => setExtraPayDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Extra Payment</DialogTitle>
            <DialogDescription>Pay an additional amount towards your loan principal. This reduces your outstanding balance faster.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Amount *</label>
              <Input
                type="number"
                placeholder="e.g. 25000"
                value={extraAmount}
                onChange={(e) => setExtraAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Note (optional)</label>
              <Textarea
                placeholder="e.g. Bonus amount, Year-end savings"
                value={extraNote}
                onChange={(e) => setExtraNote(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setExtraPayDialog(null)}>Cancel</Button>
              <Button
                onClick={() => {
                  const amt = parseFloat(extraAmount);
                  if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
                  extraPay.mutate({ id: extraPayDialog!, amount: amt, note: extraNote });
                }}
                disabled={extraPay.isPending}
              >
                {extraPay.isPending ? 'Processing...' : 'Pay'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EMI Schedule Dialog */}
      <Dialog open={!!scheduleDialog} onOpenChange={() => setScheduleDialog(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>EMI Schedule</DialogTitle>
            <DialogDescription>Breakdown of principal and interest payments.</DialogDescription>
          </DialogHeader>
          {scheduleData?.schedule && (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scheduleData.schedule.slice(0, 24)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="principal" fill="#10b981" stackId="a" name="Principal" />
                  <Bar dataKey="interest" fill="#ef4444" stackId="a" name="Interest" />
                </BarChart>
              </ResponsiveContainer>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[hsl(var(--background))]">
                    <tr className="border-b"><th className="p-2 text-left">#</th><th className="p-2 text-right">EMI</th><th className="p-2 text-right">Principal</th><th className="p-2 text-right">Interest</th><th className="p-2 text-right">Balance</th><th className="p-2">Status</th></tr>
                  </thead>
                  <tbody>
                    {scheduleData.schedule.map((s: any) => (
                      <tr key={s.month} className="border-b">
                        <td className="p-2">{s.month}</td>
                        <td className="p-2 text-right">{formatCurrency(s.emiAmount)}</td>
                        <td className="p-2 text-right">{formatCurrency(s.principal)}</td>
                        <td className="p-2 text-right">{formatCurrency(s.interest)}</td>
                        <td className="p-2 text-right">{formatCurrency(s.balance)}</td>
                        <td className="p-2 text-center">{s.isPaid ? '✅' : '⏳'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

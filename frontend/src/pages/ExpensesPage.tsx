import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Search, Filter, Trash2, Edit2, Receipt, ArrowUpRight, ArrowDownRight,
  Download, ScanLine,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { EmptyState } from '../components/ui/empty-state';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '../components/ui/dialog';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { expenseAPI, categoryAPI, exportAPI } from '../services/api';
import { formatCurrency, formatDate, PAYMENT_METHODS, downloadBlob } from '../utils/cn';
import type { Expense, Category, PaginatedResponse } from '../types';

const expenseSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['expense', 'income']),
  categoryName: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
  paymentMethod: z.string().optional(),
  vendor: z.string().optional(),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

export function ExpensesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ type: '', categoryId: '', search: '', paymentMethod: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema) as Resolver<ExpenseForm>,
    defaultValues: { type: 'expense', date: new Date().toISOString().split('T')[0] },
  });

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll().then((r) => r.data),
  });

  const { data: expensesData, isLoading } = useQuery<PaginatedResponse<Expense>>({
    queryKey: ['expenses', filters],
    queryFn: () => expenseAPI.getAll({
      ...filters,
      ...(filters.type ? { type: filters.type } : {}),
    }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: ExpenseForm) => expenseAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['category-breakdown'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-trends'] });
      queryClient.invalidateQueries({ queryKey: ['prediction'] });
      toast.success('Transaction added');
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseForm> }) => expenseAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      toast.success('Transaction updated');
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      toast.success('Transaction deleted');
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    reset({ type: 'expense', date: new Date().toISOString().split('T')[0] });
  };

  const openEdit = (expense: Expense) => {
    setEditingId(expense._id);
    reset({
      amount: expense.amount,
      type: expense.type,
      categoryName: expense.categoryName || '',
      date: new Date(expense.date).toISOString().split('T')[0],
      description: expense.description || '',
      paymentMethod: expense.paymentMethod || '',
      vendor: expense.vendor || '',
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: ExpenseForm) => {
    const cleaned = { ...data };
    if (!cleaned.paymentMethod) delete cleaned.paymentMethod;
    if (!cleaned.categoryName) delete cleaned.categoryName;
    if (!cleaned.vendor) delete cleaned.vendor;
    if (!cleaned.description) delete cleaned.description;

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: cleaned });
    } else {
      createMutation.mutate(cleaned);
    }
  };

  const [scanTip, setScanTip] = useState(false);

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    const extracted: string[] = [];
    const failed: string[] = [];

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      if (!text || text.trim().length < 10) {
        toast.error('Could not read text from this image. Make sure the receipt is clear, well-lit, and not blurry.', { duration: 6000 });
        setScanning(false);
        return;
      }

      const amountPatterns = [
        /(?:grand\s*total|total\s*amount|total\s*due|net\s*amount|total)\s*[:\s₹]*[Rs.\s]*(\d[\d,]*\.?\d*)/i,
        /(?:amount|amt|rs\.?|inr|₹)\s*[:\s]*(\d[\d,]*\.?\d*)/i,
        /(?:paid|payable|bill\s*amount)\s*[:\s₹]*[Rs.\s]*(\d[\d,]*\.?\d*)/i,
        /(\d{1,3}(?:,\d{3})*\.\d{2})\s*$/m,
        /₹\s*(\d[\d,]*\.?\d*)/,
      ];

      let amountFound = false;
      for (const pattern of amountPatterns) {
        const match = text.match(pattern);
        if (match) {
          const val = parseFloat(match[1].replace(/,/g, ''));
          if (val > 0 && val < 10000000) {
            setValue('amount', val);
            extracted.push(`Amount: ₹${val}`);
            amountFound = true;
            break;
          }
        }
      }
      if (!amountFound) failed.push('Amount');

      const datePatterns = [
        /(?:date|dt|dated|invoice\s*date|bill\s*date)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
        /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
        /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
        /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{2,4})/i,
      ];

      let dateFound = false;
      for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
          const raw = match[1];
          const native = new Date(raw);
          if (!isNaN(native.getTime()) && native.getFullYear() > 2000) {
            setValue('date', native.toISOString().split('T')[0]);
            extracted.push(`Date: ${native.toLocaleDateString()}`);
            dateFound = true;
            break;
          }
          const parts = raw.split(/[\/\-\.]/);
          if (parts.length === 3) {
            let y = parts[2], m = parts[1], d = parts[0];
            if (parts[0].length === 4) { y = parts[0]; m = parts[1]; d = parts[2]; }
            if (y.length === 2) y = `20${y}`;
            const built = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
            if (!isNaN(built.getTime())) {
              setValue('date', built.toISOString().split('T')[0]);
              extracted.push(`Date: ${built.toLocaleDateString()}`);
              dateFound = true;
              break;
            }
          }
        }
      }
      if (!dateFound) failed.push('Date');

      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
      const vendorLine = lines.find(l => !/^\d/.test(l) && !/total|amount|date|gst|tax|invoice|receipt|bill/i.test(l) && l.length > 3);
      if (vendorLine) {
        setValue('vendor', vendorLine.substring(0, 50));
        extracted.push(`Vendor: ${vendorLine.substring(0, 30)}`);
      } else if (lines[0]) {
        setValue('vendor', lines[0].substring(0, 50));
        extracted.push(`Vendor: ${lines[0].substring(0, 30)}`);
      } else {
        failed.push('Vendor');
      }

      try { await expenseAPI.uploadReceipt(file); } catch {}

      if (extracted.length > 0 && failed.length === 0) {
        toast.success(`Extracted: ${extracted.join(' · ')}`, { duration: 5000 });
      } else if (extracted.length > 0 && failed.length > 0) {
        toast.warning(
          `Extracted: ${extracted.join(' · ')}\nCould not extract: ${failed.join(', ')}. Please fill manually.`,
          { duration: 7000 },
        );
      } else {
        toast.error(
          `Could not extract any data from this receipt. Try a clearer image with visible amount, date, and store name.`,
          { duration: 7000 },
        );
      }
    } catch (err) {
      toast.error('Receipt scan failed. Make sure the image is a clear photo of a receipt.');
    } finally {
      setScanning(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    const params: Record<string, string> = {};
    if (filters.type) params.type = filters.type;
    if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
    if (filters.search) params.search = filters.search;
    if (filters.categoryId) params.categoryName = filters.categoryId;

    if (!params.type && !params.paymentMethod && !params.search) {
      const now = new Date();
      params.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      params.endDate = now.toISOString();
    }

    try {
      const res = format === 'csv'
        ? await exportAPI.csv(params)
        : format === 'excel'
        ? await exportAPI.excel(params)
        : await exportAPI.pdf(params);
      const ext = format === 'excel' ? 'xlsx' : format;
      downloadBlob(res.data, `expenses.${ext}`);
      toast.success(`Exported ${filters.type || filters.search || filters.paymentMethod ? 'filtered' : 'all'} as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed');
    }
  };

  const expenses = expensesData?.data || [];
  const selectedType = watch('type');
  const filteredCategories = categories.filter(
    (c) => c.type === selectedType || c.type === 'both',
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <Input
              placeholder="Search..."
              className="pl-9 w-full sm:w-64"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <Button size="icon" variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4" />
          </Button>
          <Button onClick={() => { reset({ type: 'expense', date: new Date().toISOString().split('T')[0] }); setDialogOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-3">
            <Select
              options={[{ value: 'expense', label: 'Expenses' }, { value: 'income', label: 'Income' }]}
              placeholder="All types"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-40"
            />
            <Select
              options={PAYMENT_METHODS.map(p => ({ value: p.value, label: p.label }))}
              placeholder="Payment method"
              value={filters.paymentMethod}
              onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
              className="w-44"
            />
            <Button variant="ghost" size="sm" onClick={() => setFilters({ type: '', categoryId: '', search: '', paymentMethod: '' })}>
              Clear
            </Button>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')} className="gap-1">
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('excel')} className="gap-1">
                <Download className="h-3.5 w-3.5" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} className="gap-1">
                <Download className="h-3.5 w-3.5" /> PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-xl bg-[hsl(var(--muted))] animate-pulse" />)}
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-12 w-12" />}
          title="No transactions yet"
          description="Add your first expense or income to get started."
          action={<Button onClick={() => setDialogOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> Add Transaction</Button>}
        />
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <Card key={expense._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  expense.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {expense.type === 'income' ? (
                    <ArrowUpRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {expense.description || expense.vendor || expense.categoryName || expense.type}
                    </p>
                    {expense.categoryName && <Badge variant="secondary" className="text-[10px]">{expense.categoryName}</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                    <span>{formatDate(expense.date)}</span>
                    {expense.paymentMethod && (
                      <>
                        <span>·</span>
                        <span className="capitalize">{expense.paymentMethod.replace('_', ' ')}</span>
                      </>
                    )}
                  </div>
                </div>
                <p className={`text-sm font-bold whitespace-nowrap ${
                  expense.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                </p>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(expense)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] cursor-pointer">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({
                      id: expense._id,
                      label: expense.description || expense.vendor || expense.categoryName || `${expense.type} - ${formatCurrency(expense.amount)}`,
                    })}
                    className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--destructive))] cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the transaction details.' : 'Enter the details of your transaction.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={selectedType === 'expense' ? 'default' : 'outline'}
                onClick={() => setValue('type', 'expense')}
                className="gap-1.5"
              >
                <ArrowDownRight className="h-4 w-4" /> Expense
              </Button>
              <Button
                type="button"
                variant={selectedType === 'income' ? 'success' : 'outline'}
                onClick={() => setValue('type', 'income')}
                className="gap-1.5"
              >
                <ArrowUpRight className="h-4 w-4" /> Income
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Amount *</label>
              <Input type="number" step="0.01" placeholder="0.00" {...register('amount')} />
              {errors.amount && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.amount.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
              <div className="min-w-0">
                <label className="text-sm font-medium mb-1.5 block">Category</label>
                <Select
                  options={filteredCategories.map(c => ({ value: c.name, label: c.name }))}
                  placeholder="Select..."
                  {...register('categoryName')}
                />
              </div>
              <div className="min-w-0">
                <label className="text-sm font-medium mb-1.5 block">Date *</label>
                <Input type="date" {...register('date')} />
                {errors.date && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.date.message}</p>}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea placeholder="What was this for?" {...register('description')} rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Payment Method</label>
                <Select
                  options={PAYMENT_METHODS.map(p => ({ value: p.value, label: p.label }))}
                  placeholder="Select..."
                  {...register('paymentMethod')}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Vendor</label>
                <Input placeholder="Store name" {...register('vendor')} />
              </div>
            </div>

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleScanReceipt}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={scanning}
                className="gap-1.5"
              >
                {scanning ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <ScanLine className="h-4 w-4" />
                )}
                {scanning ? 'Scanning...' : 'Scan Receipt'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setScanTip(!scanTip)}
                className="text-xs text-[hsl(var(--muted-foreground))]"
              >
                {scanTip ? 'Hide tips' : 'Scan tips'}
              </Button>
            </div>

            {scanTip && (
              <div className="rounded-lg bg-[hsl(var(--accent))]/50 p-3 text-xs space-y-1.5">
                <p className="font-semibold text-sm">Receipt Scanning Tips</p>
                <p>The scanner extracts <strong>Amount</strong>, <strong>Date</strong>, and <strong>Vendor name</strong> from receipt images. For best results:</p>
                <ul className="list-disc pl-4 space-y-1 text-[hsl(var(--muted-foreground))]">
                  <li>Use a <strong>clear, well-lit photo</strong> — avoid shadows and blur</li>
                  <li>Receipt should have <strong>"Total"</strong>, <strong>"Amount"</strong>, or <strong>"₹"</strong> followed by the number</li>
                  <li>Date should be in a common format: <strong>DD/MM/YYYY</strong>, <strong>DD-MM-YYYY</strong>, or <strong>01 Mar 2025</strong></li>
                  <li>Store/vendor name should be at the <strong>top of the receipt</strong></li>
                  <li>Supported formats: <strong>JPG, PNG, WEBP</strong></li>
                </ul>
                <p className="text-[hsl(var(--muted-foreground))]">Example receipt layout the scanner reads well:</p>
                <pre className="bg-[hsl(var(--background))] rounded p-2 text-[11px] font-mono leading-relaxed">
{`  SuperMart Store
  123 Main Street
  Date: 27/03/2026
  ─────────────────
  Item 1       ₹250.00
  Item 2       ₹180.00
  ─────────────────
  Total:       ₹430.00`}
                </pre>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingId ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Transaction"
        description={`Are you sure you want to delete "${deleteTarget?.label}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); }}
      />
    </div>
  );
}

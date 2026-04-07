import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Plus, Trash2, FileSpreadsheet, Eye, Download, Settings2,
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select } from '../components/ui/select';
import { EmptyState } from '../components/ui/empty-state';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '../components/ui/dialog';
import { bankImportAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/cn';
import type { BankProfile, ParsedTransaction } from '../types';

const DATE_FORMATS = [
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (01-03-2018)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (01/03/2018)' },
  { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY (03-01-2018)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2018-03-01)' },
  { value: 'DD-MMM-YYYY', label: 'DD-MMM-YYYY (01-Mar-2018)' },
];

const profileSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  dateColumn: z.string().min(1, 'Date column name is required'),
  descriptionColumn: z.string().min(1, 'Description column name is required'),
  withdrawalColumn: z.string().optional(),
  depositColumn: z.string().optional(),
  amountColumn: z.string().optional(),
  balanceColumn: z.string().optional(),
  dateFormat: z.string().default('DD-MM-YYYY'),
  headerRowIndex: z.coerce.number().min(0).default(0),
  delimiter: z.string().default(','),
  notes: z.string().optional(),
});

type ProfileForm = z.input<typeof profileSchema>;

export function BankImportPage() {
  const [profileDialog, setProfileDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState<BankProfile | null>(null);
  const [showProfiles, setShowProfiles] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedTransaction[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bankName: '',
      dateColumn: 'Date',
      descriptionColumn: 'Particulars',
      withdrawalColumn: 'Withdrawals',
      depositColumn: 'Deposits',
      amountColumn: '',
      balanceColumn: 'Balance',
      dateFormat: 'DD-MM-YYYY',
      headerRowIndex: 0,
      delimiter: ',',
      notes: '',
    },
  });

  const { data: profiles = [] } = useQuery<BankProfile[]>({
    queryKey: ['bank-profiles'],
    queryFn: () => bankImportAPI.getProfiles().then((r) => r.data),
  });

  const createProfile = useMutation({
    mutationFn: (data: any) =>
      editingProfile
        ? bankImportAPI.updateProfile(editingProfile._id, data)
        : bankImportAPI.createProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-profiles'] });
      toast.success(editingProfile ? 'Profile updated' : 'Bank profile created');
      setProfileDialog(false);
      setEditingProfile(null);
      reset();
    },
    onError: () => toast.error('Failed to save profile'),
  });

  const deleteProfile = useMutation({
    mutationFn: (id: string) => bankImportAPI.deleteProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-profiles'] });
      toast.success('Profile deleted');
    },
  });

  const openEditProfile = (p: BankProfile) => {
    setEditingProfile(p);
    reset({
      bankName: p.bankName,
      dateColumn: p.dateColumn,
      descriptionColumn: p.descriptionColumn,
      withdrawalColumn: p.withdrawalColumn || '',
      depositColumn: p.depositColumn || '',
      amountColumn: p.amountColumn || '',
      balanceColumn: p.balanceColumn || '',
      dateFormat: p.dateFormat,
      headerRowIndex: p.headerRowIndex,
      delimiter: p.delimiter,
      notes: p.notes || '',
    });
    setProfileDialog(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(null);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile || !selectedProfileId) {
      toast.error('Select a bank profile and file first');
      return;
    }
    try {
      const res = await bankImportAPI.preview(selectedProfileId, selectedFile);
      setPreview(res.data.transactions);
      toast.success(`Found ${res.data.count} transactions`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to parse file');
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !selectedProfileId) return;
    setImporting(true);
    try {
      const res = await bankImportAPI.import(selectedProfileId, selectedFile, skipDuplicates);
      toast.success(`Imported ${res.data.imported} transactions (${res.data.skipped} skipped)`);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['category-breakdown'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-trends'] });
      queryClient.invalidateQueries({ queryKey: ['prediction'] });
      setPreview(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const amountColumn = watch('amountColumn');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Import Bank Statement</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowProfiles(!showProfiles)}
          className="gap-1.5"
        >
          <Settings2 className="h-4 w-4" />
          Bank Profiles
          {showProfiles ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Bank Profiles Section */}
      {showProfiles && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Bank Column Profiles</CardTitle>
              <Button
                size="sm"
                onClick={() => { setEditingProfile(null); reset(); setProfileDialog(true); }}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add Profile
              </Button>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Configure column names for each bank's statement format. This tells the system how to read your CSV/Excel file.
            </p>
          </CardHeader>
          <CardContent>
            {profiles.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">
                No bank profiles yet. Add one to start importing statements.
              </p>
            ) : (
              <div className="space-y-2">
                {profiles.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between p-3 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]/50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{p.bankName}</p>
                        {p.isGlobal && <Badge variant="secondary" className="text-[10px]">Built-in</Badge>}
                      </div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                        Date: {p.dateColumn} · Desc: {p.descriptionColumn}
                        {p.withdrawalColumn ? ` · WD: ${p.withdrawalColumn}` : ''}
                        {p.depositColumn ? ` · Dep: ${p.depositColumn}` : ''}
                        {p.amountColumn ? ` · Amt: ${p.amountColumn}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => openEditProfile(p)}
                        className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] cursor-pointer text-sm"
                      >
                        Edit
                      </button>
                      {!p.isGlobal && (
                        <button
                          onClick={() => deleteProfile.mutate(p._id)}
                          className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--destructive))] cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Statement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Bank Profile *</label>
            <Select
              options={profiles.map((p) => ({ value: p._id, label: p.bankName }))}
              placeholder="Select your bank..."
              value={selectedProfileId}
              onChange={(e) => { setSelectedProfileId(e.target.value); setPreview(null); }}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Statement File (CSV or Excel) *</label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                onChange={handleFileSelect}
                className="flex-1"
              />
            </div>
            {selectedFile && (
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="skipDuplicates"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="skipDuplicates" className="text-sm">
              Skip duplicate transactions (same date, amount, description)
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={!selectedFile || !selectedProfileId}
              className="gap-1.5"
            >
              <Eye className="h-4 w-4" /> Preview
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || !selectedProfileId || importing}
              className="gap-1.5"
            >
              {importing ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {importing ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Table */}
      {preview && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Preview ({preview.length} transactions)
              </CardTitle>
              <Button size="sm" onClick={handleImport} disabled={importing} className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Import All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {preview.length === 0 ? (
              <EmptyState
                icon={<AlertCircle className="h-10 w-10" />}
                title="No transactions found"
                description="Check your bank profile column names and try again."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))]">
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Description</th>
                      <th className="text-right p-2 font-medium">Withdrawal</th>
                      <th className="text-right p-2 font-medium">Deposit</th>
                      <th className="text-center p-2 font-medium">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 50).map((tx, i) => (
                      <tr key={i} className="border-b border-[hsl(var(--border))]/50 hover:bg-[hsl(var(--accent))]/30">
                        <td className="p-2 whitespace-nowrap">{formatDate(tx.date)}</td>
                        <td className="p-2 max-w-[300px] truncate">{tx.description}</td>
                        <td className="p-2 text-right text-red-600 dark:text-red-400">
                          {tx.withdrawal > 0 ? formatCurrency(tx.withdrawal) : ''}
                        </td>
                        <td className="p-2 text-right text-emerald-600 dark:text-emerald-400">
                          {tx.deposit > 0 ? formatCurrency(tx.deposit) : ''}
                        </td>
                        <td className="p-2 text-center">
                          <Badge variant={tx.type === 'income' ? 'success' : 'destructive'} className="text-[10px]">
                            {tx.type}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 50 && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-2">
                    Showing first 50 of {preview.length} transactions
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No profiles hint */}
      {profiles.length === 0 && !showProfiles && (
        <EmptyState
          icon={<FileSpreadsheet className="h-12 w-12" />}
          title="Set up a Bank Profile first"
          description="Configure your bank's column names so the system knows how to read your statement file."
          action={
            <Button onClick={() => { setShowProfiles(true); setProfileDialog(true); }} className="gap-1.5">
              <Plus className="h-4 w-4" /> Create Bank Profile
            </Button>
          }
        />
      )}

      {/* Profile Create/Edit Dialog */}
      <Dialog open={profileDialog} onOpenChange={setProfileDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProfile ? 'Edit Bank Profile' : 'Create Bank Profile'}</DialogTitle>
            <DialogDescription>
              Enter the column names exactly as they appear in your bank statement CSV/Excel file header row.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createProfile.mutate(d))} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Bank Name *</label>
              <Input placeholder="e.g. ICICI Bank, SBI, HDFC" {...register('bankName')} />
              {errors.bankName && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.bankName.message}</p>}
            </div>

            <div className="bg-[hsl(var(--accent))]/50 rounded-lg p-3">
              <p className="text-xs font-semibold mb-2 uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                Column Mapping
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Date Column *</label>
                    <Input placeholder="Date" {...register('dateColumn')} />
                    {errors.dateColumn && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.dateColumn.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Description Column *</label>
                    <Input placeholder="Particulars" {...register('descriptionColumn')} />
                    {errors.descriptionColumn && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.descriptionColumn.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Withdrawal Column</label>
                    <Input
                      placeholder="Withdrawals"
                      {...register('withdrawalColumn')}
                      disabled={!!amountColumn}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Deposit Column</label>
                    <Input
                      placeholder="Deposits"
                      {...register('depositColumn')}
                      disabled={!!amountColumn}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Amount Column <span className="text-[hsl(var(--muted-foreground))] font-normal">(if single column for both)</span>
                  </label>
                  <Input placeholder="Leave empty if separate withdrawal/deposit columns" {...register('amountColumn')} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Balance Column (optional)</label>
                  <Input placeholder="Balance(INR)" {...register('balanceColumn')} />
                </div>
              </div>
            </div>

            <div className="bg-[hsl(var(--accent))]/50 rounded-lg p-3">
              <p className="text-xs font-semibold mb-2 uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                Parsing Options
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Date Format</label>
                  <Select options={DATE_FORMATS} {...register('dateFormat')} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Header Row</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    {...register('headerRowIndex', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Delimiter</label>
                  <Select
                    options={[
                      { value: ',', label: 'Comma (,)' },
                      { value: '\t', label: 'Tab' },
                      { value: ';', label: 'Semicolon (;)' },
                      { value: '|', label: 'Pipe (|)' },
                    ]}
                    {...register('delimiter')}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Notes (optional)</label>
              <Input placeholder="Any notes about this bank format" {...register('notes')} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setProfileDialog(false); setEditingProfile(null); }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProfile ? 'Update' : 'Create'} Profile
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

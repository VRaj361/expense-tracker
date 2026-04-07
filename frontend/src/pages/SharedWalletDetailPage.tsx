import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, PieChart as PieIcon, List, FileText, Scale, Users, Copy, Check, Download,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Select } from '../components/ui/select';
import { useVisiblePollInterval } from '../hooks/useVisiblePollInterval';
import { sharedWalletAPI } from '../services/api';
import { formatCurrency, formatCurrencyCompact, formatDate } from '../utils/cn';
import type {
  SharedWalletBalances,
  SharedWalletEntryRow,
  SharedWalletMemberRow,
  SharedWalletSummary,
} from '../types';

/** Poll shared-wallet data only while the tab is visible (~45s) to limit server load. */
const WALLET_POLL_MS = 45_000;

function memberLabel(m: SharedWalletMemberRow) {
  const d = m.displayName?.trim();
  if (d) return d;
  if (m.userId?.name) return m.userId.name;
  return m.email;
}

function WalletMemberNameInput({
  member,
  isOwner,
  saving,
  onSave,
}: {
  member: SharedWalletMemberRow;
  isOwner: boolean;
  saving: boolean;
  onSave: (displayName: string) => void;
}) {
  const effective = (member.displayName?.trim() || member.userId?.name || '').slice(0, 80);
  const [val, setVal] = useState(effective);
  useEffect(() => {
    setVal((member.displayName?.trim() || member.userId?.name || '').slice(0, 80));
  }, [member._id, member.displayName, member.userId?.name]);
  if (!isOwner) {
    return <p className="font-medium">{memberLabel(member)}</p>;
  }
  const custom = member.displayName?.trim();
  const unchanged = custom ? val.trim() === custom : val.trim() === (member.userId?.name || '').trim();
  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <Input
        className="h-10 w-full min-w-0 max-w-full text-sm sm:max-w-[280px]"
        value={val}
        onChange={(e) => setVal(e.target.value.slice(0, 80))}
        placeholder="Name in this wallet"
        aria-label={`Display name for ${member.email}`}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={saving || unchanged}
          onClick={() => onSave(val.trim())}
        >
          Save
        </Button>
        {member.displayName?.trim() ? (
          <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => onSave('')}>
            Use FinTrack name
          </Button>
        ) : null}
      </div>
    </div>
  );
}
const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'];

type Tab = 'activity' | 'insights' | 'report' | 'settle' | 'members';

export function SharedWalletDetailPage() {
  const { walletId = '' } = useParams<{ walletId: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('activity');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [entryOpen, setEntryOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [spentAt, setSpentAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [onBehalf, setOnBehalf] = useState<string>('');
  const [settleOpen, setSettleOpen] = useState(false);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [settleNote, setSettleNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const walletPollMs = useVisiblePollInterval(WALLET_POLL_MS);

  const { data: detail, isLoading: dLoading } = useQuery({
    queryKey: ['shared-wallet', walletId],
    queryFn: () => sharedWalletAPI.detail(walletId).then((r) => r.data),
    enabled: !!walletId,
    refetchInterval: walletPollMs,
    refetchOnWindowFocus: true,
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['shared-wallet-entries', walletId],
    queryFn: () => sharedWalletAPI.entries(walletId).then((r) => r.data),
    enabled: !!walletId,
    refetchInterval: walletPollMs,
    refetchOnWindowFocus: true,
  });

  const { data: summary } = useQuery<SharedWalletSummary>({
    queryKey: ['shared-wallet-summary', walletId],
    queryFn: () => sharedWalletAPI.summary(walletId).then((r) => r.data),
    enabled: !!walletId,
    refetchInterval: walletPollMs,
    refetchOnWindowFocus: true,
  });

  const { data: report = [] } = useQuery({
    queryKey: ['shared-wallet-report', walletId],
    queryFn: () => sharedWalletAPI.report(walletId).then((r) => r.data),
    enabled: !!walletId && tab === 'report',
    refetchInterval: tab === 'report' ? walletPollMs : false,
    refetchOnWindowFocus: true,
  });

  const { data: settlements = [] } = useQuery({
    queryKey: ['shared-wallet-settlements', walletId],
    queryFn: () => sharedWalletAPI.settlements(walletId).then((r) => r.data),
    enabled: !!walletId && tab === 'settle',
    refetchInterval: tab === 'settle' ? walletPollMs : false,
    refetchOnWindowFocus: true,
  });

  const { data: hints } = useQuery({
    queryKey: ['shared-wallet-hints', walletId],
    queryFn: () => sharedWalletAPI.settlementHints(walletId).then((r) => r.data),
    enabled: !!walletId && tab === 'settle',
    refetchInterval: tab === 'settle' ? walletPollMs : false,
    refetchOnWindowFocus: true,
  });

  const { data: balances } = useQuery<SharedWalletBalances>({
    queryKey: ['shared-wallet-balances', walletId],
    queryFn: () => sharedWalletAPI.balances(walletId).then((r) => r.data),
    enabled: !!walletId && (tab === 'insights' || tab === 'settle'),
    refetchInterval: tab === 'insights' || tab === 'settle' ? walletPollMs : false,
    refetchOnWindowFocus: true,
  });

  const wallet = detail?.wallet;
  const myRole = detail?.myRole as string | undefined;
  const members = (detail?.members || []) as SharedWalletMemberRow[];
  const canWrite = myRole === 'owner' || myRole === 'editor';
  const isOwner = myRole === 'owner';
  const currency = wallet?.currency || 'INR';

  const activeMembers = useMemo(
    () => members.filter((m) => m.status === 'active' && m.userId),
    [members],
  );

  const inviteMut = useMutation({
    mutationFn: () =>
      sharedWalletAPI.invite(walletId, { email: inviteEmail.trim(), role: inviteRole }),
    onSuccess: (res) => {
      const url = res.data.inviteUrl as string;
      setLastInviteUrl(url);
      toast.success(res.data.emailSent ? 'Invite sent by email' : 'Invite created (email not configured)');
      qc.invalidateQueries({ queryKey: ['shared-wallet', walletId] });
      setInviteEmail('');
    },
    onError: () => toast.error('Invite failed'),
  });

  const entryMut = useMutation({
    mutationFn: () =>
      sharedWalletAPI.addEntry(walletId, {
        amount: Number(amount),
        category: category || undefined,
        description: desc || undefined,
        spentAt: new Date(spentAt).toISOString(),
        onBehalfOfUserId: isOwner && onBehalf ? onBehalf : undefined,
      }),
    onSuccess: () => {
      toast.success('Entry added');
      qc.invalidateQueries({ queryKey: ['shared-wallet-entries', walletId] });
      qc.invalidateQueries({ queryKey: ['shared-wallet-summary', walletId] });
      qc.invalidateQueries({ queryKey: ['shared-wallet-balances', walletId] });
      qc.invalidateQueries({ queryKey: ['shared-wallet-report', walletId] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
      setEntryOpen(false);
      setAmount('');
      setCategory('');
      setDesc('');
      setOnBehalf('');
    },
    onError: () => toast.error('Could not add entry'),
  });

  const settleMut = useMutation({
    mutationFn: () =>
      sharedWalletAPI.addSettlement(walletId, {
        fromUserId: fromId,
        toUserId: toId,
        amount: Number(settleAmount),
        note: settleNote || undefined,
      }),
    onSuccess: () => {
      toast.success('Settlement recorded');
      qc.invalidateQueries({ queryKey: ['shared-wallet-settlements', walletId] });
      qc.invalidateQueries({ queryKey: ['shared-wallet-balances', walletId] });
      qc.invalidateQueries({ queryKey: ['shared-wallet-hints', walletId] });
      setSettleOpen(false);
      setSettleAmount('');
      setSettleNote('');
    },
    onError: () => toast.error('Could not save settlement'),
  });

  const roleMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'editor' | 'viewer' }) =>
      sharedWalletAPI.updateMemberRole(walletId, id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shared-wallet', walletId] });
      toast.success('Role updated');
    },
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => sharedWalletAPI.removeMember(walletId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shared-wallet', walletId] });
      toast.success('Member removed');
    },
  });

  const displayNameMut = useMutation({
    mutationFn: ({ memberId, displayName }: { memberId: string; displayName: string }) =>
      sharedWalletAPI.updateMemberDisplayName(walletId, memberId, displayName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shared-wallet', walletId] });
      qc.invalidateQueries({ queryKey: ['shared-wallet-summary', walletId] });
      qc.invalidateQueries({ queryKey: ['shared-wallet-balances', walletId] });
      toast.success('Display name saved');
    },
    onError: () => toast.error('Could not update name'),
  });

  const downloadReportPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await sharedWalletAPI.reportPdf(walletId);
      const ct = String(res.headers['content-type'] || '').toLowerCase();
      const raw = res.data as Blob;
      if (!ct.includes('application/pdf')) {
        const text = await raw.text();
        try {
          const j = JSON.parse(text) as { message?: string };
          toast.error(j.message || 'Could not download PDF');
        } catch {
          toast.error('Could not download PDF');
        }
        return;
      }
      const blob = new Blob([raw], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const base = (wallet?.name || 'shared-wallet').replace(/[^\w\s-]/g, '').trim().slice(0, 48) || 'shared-wallet';
      a.download = `${base}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Could not download PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const pieData = useMemo(
    () => (summary?.byUser || []).map((r) => ({ name: r.name, value: r.total })),
    [summary],
  );

  if (dLoading || !wallet) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[hsl(var(--muted-foreground))]">
        Loading wallet…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-3 pb-4 pt-1 sm:px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-1 shrink-0">
            <Link to="/shared-wallets"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold leading-tight truncate sm:text-2xl">{wallet.name}</h1>
            {wallet.description && (
              <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">{wallet.description}</p>
            )}
          </div>
        </div>
        {canWrite && (
          <Button size="sm" className="h-10 w-full shrink-0 gap-1 sm:h-9 sm:w-auto" onClick={() => setEntryOpen(true)}>
            <Plus className="h-4 w-4" /> Add entry
          </Button>
        )}
      </div>

      <div
        className="grid grid-cols-2 gap-2 border-b border-[hsl(var(--border))] pb-3 sm:flex sm:flex-wrap sm:gap-2"
        role="tablist"
        aria-label="Wallet sections"
      >
        {([
          ['activity', List, 'Activity'],
          ['insights', PieIcon, 'Insights'],
          ['report', FileText, 'Report'],
          ['settle', Scale, 'Settle'],
          ['members', Users, 'Members'],
        ] as const).map(([k, Icon, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors sm:min-h-0 sm:justify-start sm:rounded-lg sm:py-2 ${
              tab === k
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm'
                : 'border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] sm:border-0 sm:bg-transparent'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {tab === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entries</CardTitle>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              While this tab is open and visible, data refreshes about every {WALLET_POLL_MS / 1000}s; switching away pauses polling. Focus this window or change tabs back to catch up.
            </p>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {(entries as SharedWalletEntryRow[]).length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] px-6 py-4">No entries yet.</p>
            ) : (
              <>
              <div className="divide-y divide-[hsl(var(--border))] md:hidden">
                {(entries as SharedWalletEntryRow[]).map((e) => (
                  <div key={e._id} className="space-y-2 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400">
                          {formatCurrencyCompact(e.amount, currency)}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatDate(e.spentAt)}</p>
                      </div>
                      <Badge variant="secondary">{e.type}</Badge>
                    </div>
                    {(e.category || e.description) && (
                      <p className="text-sm text-[hsl(var(--foreground))]">
                        {[e.category, e.description].filter(Boolean).join(' · ') || '—'}
                      </p>
                    )}
                    <div className="rounded-lg bg-[hsl(var(--muted))]/20 px-3 py-2 text-sm">
                      <p>
                        <span className="text-[hsl(var(--muted-foreground))]">Paid by </span>
                        <span className="font-semibold text-[hsl(var(--foreground))]">{e.createdByUserId?.name || '—'}</span>
                      </p>
                      <p className="mt-1">
                        <span className="text-[hsl(var(--muted-foreground))]">For </span>
                        <span className="font-semibold text-[hsl(var(--foreground))]">
                          {e.onBehalfOfUserId?.name || e.createdByUserId?.name || '—'}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto rounded-md border border-[hsl(var(--border))] md:block md:border-0 md:rounded-none">
                <table className="w-full min-w-[720px] text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/25 text-left">
                      <th className="px-3 py-3 font-semibold text-[hsl(var(--foreground))] whitespace-nowrap">Date</th>
                      <th className="px-3 py-3 font-semibold text-right whitespace-nowrap">Amount</th>
                      <th className="px-3 py-3 font-semibold whitespace-nowrap">Category</th>
                      <th className="px-3 py-3 font-semibold min-w-[120px]">Paid by</th>
                      <th className="px-3 py-3 font-semibold min-w-[120px]">Attributed to</th>
                      <th className="px-3 py-3 font-semibold min-w-[140px]">Note</th>
                      <th className="px-3 py-3 font-semibold text-center w-[88px]">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(entries as SharedWalletEntryRow[]).map((e) => (
                      <tr
                        key={e._id}
                        className="border-b border-[hsl(var(--border))]/70 hover:bg-[hsl(var(--accent))]/40 transition-colors"
                      >
                        <td className="px-3 py-3 whitespace-nowrap text-[hsl(var(--muted-foreground))] align-top">
                          {formatDate(e.spentAt)}
                        </td>
                        <td className="px-3 py-3 text-right font-bold tabular-nums text-red-600 dark:text-red-400 align-top">
                          {formatCurrency(e.amount, currency)}
                        </td>
                        <td className="px-3 py-3 text-[hsl(var(--foreground))] align-top">{e.category || '—'}</td>
                        <td className="px-3 py-3 align-top">
                          <span className="font-semibold text-[hsl(var(--foreground))]">
                            {e.createdByUserId?.name || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span className="font-semibold text-[hsl(var(--foreground))]">
                            {e.onBehalfOfUserId?.name || e.createdByUserId?.name || '—'}
                          </span>
                          {e.onBehalfOfUserId && (
                            <span className="block text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                              (logged by {e.createdByUserId?.name || '—'})
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-[hsl(var(--muted-foreground))] align-top max-w-[200px] break-words">
                          {e.description || '—'}
                        </td>
                        <td className="px-3 py-3 text-center align-top">
                          <Badge variant="secondary" className="font-normal">{e.type}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'insights' && summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Totals</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Group expenses: <strong>{formatCurrency(summary.expenseTotal, currency)}</strong></p>
              <p>Entries: {summary.entryCount}</p>
              {summary.highestSpender && (
                <p>Highest attributed spend: <strong>{summary.highestSpender.name}</strong> ({formatCurrency(summary.highestSpender.total, currency)})</p>
              )}
              {summary.lowestSpender && summary.byUser.length > 1 && (
                <p>Lowest: <strong>{summary.lowestSpender.name}</strong> ({formatCurrency(summary.lowestSpender.total, currency)})</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">By person</CardTitle>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Legend shows full names; hover slices for amounts.</p>
            </CardHeader>
            <CardContent className="min-h-[300px] h-[340px] pb-2">
              {pieData.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">No expense data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="42%"
                      innerRadius={0}
                      outerRadius="78%"
                      paddingAngle={1}
                      label={false}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="hsl(var(--background))" strokeWidth={1} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [formatCurrency(Number(value ?? 0), currency), String(name)]}
                      contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      layout="horizontal"
                      wrapperStyle={{ paddingTop: 12, fontSize: 12 }}
                      formatter={(value, entry: { payload?: { value?: number } }) => {
                        const v = entry?.payload?.value ?? 0;
                        const total = pieData.reduce((s, p) => s + p.value, 0);
                        const pct = total ? ((v / total) * 100).toFixed(0) : '0';
                        return `${value} — ${formatCurrency(v, currency)} (${pct}%)`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {balances && balances.members.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Attributed expenses by member</CardTitle>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Green = at or above equal fair share; red = below fair share (equal split of group total).
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3 md:hidden">
                  {balances.members.map((m) => {
                    const diff = m.attributedSpend - m.fairShare;
                    const pos = diff >= 0;
                    const highContributor = m.attributedSpend + 0.01 >= m.fairShare;
                    return (
                      <div
                        key={m.userId}
                        className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-2"
                      >
                        <p className="font-semibold text-[hsl(var(--foreground))]">{m.name}</p>
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div className="flex justify-between gap-2">
                            <span className="text-[hsl(var(--muted-foreground))]">Attributed</span>
                            <span
                              className={`text-right font-semibold tabular-nums ${
                                highContributor
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {formatCurrencyCompact(m.attributedSpend, currency)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-[hsl(var(--muted-foreground))]">Fair share</span>
                            <span className="text-right tabular-nums text-[hsl(var(--muted-foreground))]">
                              {formatCurrencyCompact(m.fairShare, currency)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-2 border-t border-[hsl(var(--border))]/60 pt-2">
                            <span className="text-[hsl(var(--muted-foreground))]">vs fair share</span>
                            <span
                              className={`text-right font-semibold tabular-nums ${
                                pos ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {pos ? '+' : ''}
                              {formatCurrencyCompact(diff, currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[520px] text-sm text-left">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                      <th className="pb-2 pr-3 font-medium">Member</th>
                      <th className="pb-2 pr-3 font-medium text-right">Attributed</th>
                      <th className="pb-2 pr-3 font-medium text-right">Fair share</th>
                      <th className="pb-2 font-medium text-right">vs fair share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.members.map((m) => {
                      const diff = m.attributedSpend - m.fairShare;
                      const pos = diff >= 0;
                      const highContributor = m.attributedSpend + 0.01 >= m.fairShare;
                      return (
                        <tr key={m.userId} className="border-b border-[hsl(var(--border))]/50">
                          <td className="py-2.5 pr-3 font-medium">{m.name}</td>
                          <td
                            className={`py-2.5 pr-3 text-right tabular-nums font-semibold ${
                              highContributor
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {formatCurrency(m.attributedSpend, currency)}
                          </td>
                          <td className="py-2.5 pr-3 text-right tabular-nums text-[hsl(var(--muted-foreground))]">
                            {formatCurrency(m.fairShare, currency)}
                          </td>
                          <td
                            className={`py-2.5 text-right tabular-nums font-semibold ${
                              pos ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {pos ? '+' : ''}
                            {formatCurrency(diff, currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </CardContent>
            </Card>
          )}

          {balances && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Who should pay whom</CardTitle>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  After equal split and recorded settlements. Positive net = owed back; negative = still owes others.
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {balances.suggestedTransfers.length === 0 ? (
                  <p className="text-[hsl(var(--muted-foreground))]">No remaining transfers — balances match.</p>
                ) : (
                  <ul className="space-y-2">
                    {balances.suggestedTransfers.map((t, idx) => (
                      <li
                        key={`${t.fromUserId}-${t.toUserId}-${idx}`}
                        className="flex flex-col gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between"
                      >
                        <span className="min-w-0 text-sm leading-snug sm:text-base">
                          <strong className="text-emerald-600 dark:text-emerald-400">{t.fromName}</strong>
                          <span className="text-[hsl(var(--muted-foreground))] mx-1">pays</span>
                          <strong className="text-amber-600 dark:text-amber-400">{t.toName}</strong>
                        </span>
                        <span className="text-lg font-semibold tabular-nums sm:text-base">
                          <span className="md:hidden">{formatCurrencyCompact(t.amount, currency)}</span>
                          <span className="hidden md:inline">{formatCurrency(t.amount, currency)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="pt-2 border-t border-[hsl(var(--border))]/60 text-xs text-[hsl(var(--muted-foreground))]">
                  <p className="font-medium text-[hsl(var(--foreground))] mb-1">Net after settlements</p>
                  <ul className="space-y-1">
                    {balances.members.map((m) => (
                      <li key={m.userId} className="flex justify-between gap-3">
                        <span className="min-w-0 shrink">{m.name}</span>
                        <span
                          className={
                            m.netAfterSettlements > 0.01
                              ? 'text-emerald-600 dark:text-emerald-400 font-medium tabular-nums text-right shrink-0'
                              : m.netAfterSettlements < -0.01
                                ? 'text-red-600 dark:text-red-400 font-medium tabular-nums text-right shrink-0'
                                : 'tabular-nums text-[hsl(var(--muted-foreground))] text-right shrink-0'
                          }
                        >
                          <span className="md:hidden">{formatCurrencyCompact(m.netAfterSettlements, currency)}</span>
                          <span className="hidden md:inline">{formatCurrency(m.netAfterSettlements, currency)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === 'report' && (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Where & who</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0 w-full sm:w-auto"
              disabled={pdfLoading}
              onClick={() => downloadReportPdf()}
            >
              <Download className="h-4 w-4" />
              {pdfLoading ? 'Preparing…' : 'Download PDF'}
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] text-left text-[hsl(var(--muted-foreground))]">
                  <th className="pb-2 pr-2">Date</th>
                  <th className="pb-2 pr-2">Amount</th>
                  <th className="pb-2 pr-2">Category</th>
                  <th className="pb-2 pr-2">Who paid</th>
                  <th className="pb-2">Attributed to</th>
                </tr>
              </thead>
              <tbody>
                {report.map((r: any) => (
                  <tr key={r._id} className="border-b border-[hsl(var(--border))]/60">
                    <td className="py-2 pr-2 whitespace-nowrap">{formatDate(r.spentAt)}</td>
                    <td className="py-2 pr-2 font-semibold text-red-600 dark:text-red-400 tabular-nums">
                      {formatCurrency(r.amount, currency)}
                    </td>
                    <td className="py-2 pr-2">{r.category || '—'}</td>
                    <td className="py-2 pr-2">{r.createdBy?.name || '—'}</td>
                    <td className="py-2">{(r.attributedTo && r.attributedTo.name) || r.createdBy?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === 'settle' && (
        <div className="space-y-4">
          {balances && balances.suggestedTransfers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Suggested payments</CardTitle>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Based on equal split and settlements already recorded.</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {balances.suggestedTransfers.map((t, idx) => (
                  <div
                    key={`${t.fromUserId}-${t.toUserId}-${idx}`}
                    className="flex flex-col gap-2 rounded-xl border border-[hsl(var(--border))] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="min-w-0 text-sm sm:text-base">
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{t.fromName}</span>
                      <span className="text-[hsl(var(--muted-foreground))] mx-1">→</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">{t.toName}</span>
                    </span>
                    <span className="text-lg font-semibold tabular-nums sm:text-base">
                      <span className="sm:hidden">{formatCurrencyCompact(t.amount, currency)}</span>
                      <span className="hidden sm:inline">{formatCurrency(t.amount, currency)}</span>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {hints && (
            <Card>
              <CardHeader><CardTitle className="text-base">Fair share hint</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>Equal split of total expenses: <strong>{formatCurrency(hints.fairSharePerMember, currency)}</strong> per member</p>
                <ul className="mt-2 space-y-1">
                  {hints.hints?.map((h: any) => (
                    <li key={h.userId}>
                      {h.name}: spent {formatCurrency(h.spent, currency)} — {h.vsFairShare >= 0 ? '+' : ''}
                      {formatCurrency(Math.abs(h.vsFairShare), currency)} vs fair share
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {canWrite && (
            <Button onClick={() => setSettleOpen(true)}>Record settlement</Button>
          )}
          <Card>
            <CardHeader><CardTitle className="text-base">Recorded settlements</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {settlements.length === 0 ? (
                <p className="text-[hsl(var(--muted-foreground))]">None yet.</p>
              ) : (
                settlements.map((s: any) => (
                  <div key={s._id} className="border-b border-[hsl(var(--border))]/60 pb-2">
                    <strong>{formatCurrency(s.amount, currency)}</strong> from {s.fromUserId?.name} → {s.toUserId?.name}
                    <span className="text-[hsl(var(--muted-foreground))] text-xs ml-2">{formatDate(s.createdAt)}</span>
                    {s.note && <p className="text-xs mt-1">{s.note}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'members' && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Members</CardTitle>
            {isOwner && (
              <Button size="sm" onClick={() => { setInviteOpen(true); setLastInviteUrl(''); }}>Invite</Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {members.map((m) => (
              <div
                key={m._id}
                className="flex flex-col gap-4 border-b border-[hsl(var(--border))]/60 pb-4 last:border-0 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between"
              >
                <div className="w-full min-w-0 flex-1 space-y-2">
                  <WalletMemberNameInput
                    member={m}
                    isOwner={isOwner}
                    saving={displayNameMut.isPending}
                    onSave={(displayName) => displayNameMut.mutate({ memberId: m._id, displayName })}
                  />
                  <p className="text-xs text-[hsl(var(--muted-foreground))] break-words [overflow-wrap:anywhere]">
                    {m.email}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge>{m.role}</Badge>
                    <Badge variant="outline">{m.status}</Badge>
                  </div>
                </div>
                {isOwner && m.role !== 'owner' && m.status === 'active' && (
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:max-w-[240px] sm:flex-col">
                    <Select
                      className="h-10 w-full min-w-0 sm:h-9"
                      value={m.role}
                      onChange={(e) =>
                        roleMut.mutate({ id: m._id, role: e.target.value as 'editor' | 'viewer' })
                      }
                      options={[
                        { value: 'editor', label: 'Editor' },
                        { value: 'viewer', label: 'Viewer' },
                      ]}
                    />
                    <Button variant="destructive" size="sm" className="w-full sm:w-auto" onClick={() => removeMut.mutate(m._id)}>
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite member</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input type="email" placeholder="Email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            <Select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
              options={[
                { value: 'editor', label: 'Can add entries (editor)' },
                { value: 'viewer', label: 'View only' },
              ]}
            />
            {lastInviteUrl && (
              <div className="rounded-lg border border-[hsl(var(--border))] p-3 text-xs break-all">
                <p className="font-medium mb-1">Copy link if email did not arrive:</p>
                <p className="text-[hsl(var(--muted-foreground))]">{lastInviteUrl}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-1"
                  onClick={() => {
                    navigator.clipboard.writeText(lastInviteUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    toast.success('Copied');
                  }}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  Copy link
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Close</Button>
            <Button disabled={!inviteEmail.trim() || inviteMut.isPending} onClick={() => inviteMut.mutate()}>
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add entry</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Input placeholder="Category (optional)" value={category} onChange={(e) => setCategory(e.target.value)} />
            <Textarea placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <Input type="date" value={spentAt} onChange={(e) => setSpentAt(e.target.value)} />
            {isOwner && activeMembers.length > 0 && (
              <div>
                <label className="text-sm text-[hsl(var(--muted-foreground))]">On behalf of (optional)</label>
                <Select
                  className="mt-1"
                  value={onBehalf || '__self'}
                  onChange={(e) => setOnBehalf(e.target.value === '__self' ? '' : e.target.value)}
                  options={[
                    { value: '__self', label: 'Yourself' },
                    ...activeMembers
                      .filter((m) => m.userId)
                      .map((m) => ({ value: m.userId!._id, label: memberLabel(m) })),
                  ]}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryOpen(false)}>Cancel</Button>
            <Button
              disabled={!amount || Number(amount) <= 0 || entryMut.isPending}
              onClick={() => entryMut.mutate()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record settlement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              placeholder="From (payer)"
              options={activeMembers
                .filter((m) => m.userId)
                .map((m) => ({ value: m.userId!._id, label: memberLabel(m) }))}
            />
            <Select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              placeholder="To (receiver)"
              options={activeMembers
                .filter((m) => m.userId)
                .map((m) => ({ value: m.userId!._id, label: memberLabel(m) }))}
            />
            <Input type="number" placeholder="Amount" value={settleAmount} onChange={(e) => setSettleAmount(e.target.value)} />
            <Input placeholder="Note" value={settleNote} onChange={(e) => setSettleNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettleOpen(false)}>Cancel</Button>
            <Button
              disabled={!fromId || !toId || !settleAmount || settleMut.isPending}
              onClick={() => settleMut.mutate()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

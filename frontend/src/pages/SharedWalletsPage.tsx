import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { UsersRound, Plus, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { sharedWalletAPI } from '../services/api';
import type { SharedWallet } from '../types';

export function SharedWalletsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['shared-wallets'],
    queryFn: () => sharedWalletAPI.list().then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: () => sharedWalletAPI.create({ name: name.trim(), description: description.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shared-wallets'] });
      toast.success('Shared wallet created');
      setOpen(false);
      setName('');
      setDescription('');
    },
    onError: () => toast.error('Could not create wallet'),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[hsl(var(--primary))]">
            <UsersRound className="h-6 w-6" />
            <span className="text-sm font-semibold uppercase tracking-wide">Shared wallets</span>
          </div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Split expenses with others</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))] max-w-xl">
            Group spending stays here — it does not appear on your personal dashboard or transactions.
            Invite people by email or share a secure link.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          New wallet
        </Button>
      </div>

      {isLoading ? (
        <Card><CardContent className="py-12 text-center text-[hsl(var(--muted-foreground))]">Loading…</CardContent></Card>
      ) : rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center">
            <UsersRound className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))] opacity-50" />
            <p className="mt-4 font-medium">No shared wallets yet</p>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Create one to start tracking group expenses.</p>
            <Button className="mt-6" onClick={() => setOpen(true)}>Create wallet</Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((row: { wallet: SharedWallet; role: string; membershipId: string }) => (
            <li key={row.wallet._id}>
              <Link to={`/shared-wallets/${row.wallet._id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                      <UsersRound className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{row.wallet.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] capitalize">Your role: {row.role}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-[hsl(var(--muted-foreground))]" />
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create shared wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Weekend trip, Flatmates…" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              disabled={!name.trim() || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

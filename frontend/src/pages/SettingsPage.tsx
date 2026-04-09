import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useStore } from '../store/useStore';
import { userAPI, categoryAPI } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { Trash2, Plus } from 'lucide-react';
import { useState } from 'react';
import type { Category } from '../types';

export function SettingsPage() {
  const { user, setUser, logout } = useStore();
  const queryClient = useQueryClient();
  const [newCat, setNewCat] = useState({ name: '', color: '#6366f1', type: 'expense' });
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const { register, handleSubmit } = useForm({
    defaultValues: { phone: user?.phone || '', currency: user?.currency || 'INR' },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll().then((r) => r.data),
  });

  const updateProfile = useMutation({
    mutationFn: (data: any) => userAPI.updateProfile(data),
    onSuccess: (res) => { setUser(res.data); toast.success('Profile updated'); },
  });

  const addCategory = useMutation({
    mutationFn: () => categoryAPI.create(newCat),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setNewCat({ name: '', color: '#6366f1', type: 'expense' });
      toast.success('Category added');
    },
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => categoryAPI.delete(id),
    onSuccess: () => {
      setCategoryToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success('Category removed. Linked transactions use “Other”.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Could not remove category';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => updateProfile.mutate(d))} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input value={user?.email || ''} disabled />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone</label>
              <Input {...register('phone')} placeholder="+91..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Currency</label>
              <Input {...register('currency')} placeholder="INR" />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Add your own or remove any category (including defaults). Transactions stay in your history; anything that used a removed category is moved to <strong>Other</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Category name"
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
              className="flex-1"
            />
            <input
              type="color"
              value={newCat.color}
              onChange={(e) => setNewCat({ ...newCat, color: e.target.value })}
              className="w-10 h-10 rounded-lg cursor-pointer"
            />
            <select
              value={newCat.type}
              onChange={(e) => setNewCat({ ...newCat, type: e.target.value })}
              className="h-10 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] px-2 text-sm"
            >
              <option value="expense" className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">Expense</option>
              <option value="income" className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">Income</option>
              <option value="both" className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">Both</option>
            </select>
            <Button onClick={() => newCat.name && addCategory.mutate()} size="icon"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-2">
            {(categories as Category[]).map((c) => (
              <div
                key={c._id}
                className="flex items-center gap-2 min-w-0 p-2 rounded-lg hover:bg-[hsl(var(--accent))]"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="min-w-0 truncate text-sm">{c.name}</span>
                  <span className="shrink-0 text-xs text-[hsl(var(--muted-foreground))]">
                    ({c.type})
                  </span>
                </div>
                <button
                  type="button"
                  title="Remove category"
                  aria-label={`Remove category ${c.name}`}
                  onClick={() => setCategoryToDelete(c)}
                  disabled={deleteCategory.isPending}
                  className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10 disabled:opacity-50 sm:h-9 sm:w-9"
                >
                  <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <Button variant="destructive" onClick={logout}>Sign Out</Button>
        </CardContent>
      </Card>

      <Dialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove category?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
                <p>
                  <span className="font-medium text-[hsl(var(--foreground))]">{categoryToDelete?.name}</span> will be
                  removed from your list.
                </p>
                <p>
                  Transactions, budgets, recurring items, and automation rules that use this category will be reassigned
                  to <span className="font-medium text-[hsl(var(--foreground))]">Other</span>. Nothing is deleted from
                  your ledger.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setCategoryToDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteCategory.isPending}
              onClick={() => categoryToDelete && deleteCategory.mutate(categoryToDelete._id)}
            >
              {deleteCategory.isPending ? 'Removing…' : 'Remove category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

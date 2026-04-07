import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
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
        <CardHeader><CardTitle>Custom Categories</CardTitle></CardHeader>
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
              <div key={c._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[hsl(var(--accent))]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm">{c.name}</span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">({c.type})</span>
                </div>
                {!c.isDefault && (
                  <button onClick={() => deleteCategory.mutate(c._id)} className="p-1 cursor-pointer text-[hsl(var(--destructive))]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
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
    </div>
  );
}

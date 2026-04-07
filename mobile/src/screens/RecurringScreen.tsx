import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useThemeColors } from '../theme';
import { recurringAPI, categoryAPI } from '../services/api';
import { EmptyState, Button, Input, Select, Badge, ConfirmDialog } from '../components/ui';
import { formatCurrency, formatDate, FREQUENCIES } from '../utils/helpers';
import { useStore } from '../store/useStore';
import type { RecurringExpense } from '../types';

export function RecurringScreen() {
  const colors = useThemeColors();
  const currency = useStore((s) => s.user?.currency) || 'INR';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: '', type: 'expense' as string, categoryId: '', description: '', frequency: 'monthly', paymentMethod: '' });

  const { data: items, isLoading, refetch } = useQuery({
    queryKey: ['recurring'],
    queryFn: () => recurringAPI.getAll().then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => recurringAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      Toast.show({ type: 'success', text1: 'Recurring item added' });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => recurringAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      Toast.show({ type: 'success', text1: 'Deleted' });
      setDeleteId(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      recurringAPI.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring'] }),
  });

  const [refreshing, setRefreshing] = useState(false);
  const categoryOptions = (categories || []).map((c: any) => ({ value: c._id, label: c.name }));

  const handleCreate = () => {
    if (!form.amount) return;
    const cat = categories?.find((c: any) => c._id === form.categoryId);
    createMutation.mutate({
      amount: parseFloat(form.amount),
      type: form.type,
      categoryId: form.categoryId || undefined,
      categoryName: cat?.name,
      description: form.description || undefined,
      frequency: form.frequency,
      nextDueDate: new Date().toISOString(),
    });
  };

  const renderItem = ({ item }: { item: RecurringExpense }) => (
    <TouchableOpacity
      onPress={() => setDeleteId(item._id)}
      style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.itemHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemName, { color: colors.text }]}>
            {item.description || item.categoryName || 'Recurring'}
          </Text>
          <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
            {item.frequency} · Next: {formatDate(item.nextDueDate)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.itemAmount, { color: item.type === 'income' ? colors.income : colors.expense }]}>
            {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, currency)}
          </Text>
          <TouchableOpacity onPress={() => toggleMutation.mutate({ id: item._id, isActive: !item.isActive })}>
            <Badge text={item.isActive ? 'Active' : 'Paused'} variant={item.isActive ? 'success' : 'warning'} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items || []}
        keyExtractor={(item: RecurringExpense) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} />}
        ListEmptyComponent={
          isLoading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} /> :
            <EmptyState icon="repeat-outline" title="No recurring items" description="Set up recurring expenses or income" actionLabel="Add Recurring" onAction={() => setShowForm(true)} />
        }
      />

      <TouchableOpacity onPress={() => setShowForm(true)} style={[styles.fab, { backgroundColor: colors.primary }]}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showForm} transparent animationType="slide">
        <TouchableOpacity style={[styles.overlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={() => setShowForm(false)}>
          <SafeAreaView style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <ScrollView>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Recurring</Text>
              <View style={styles.typeRow}>
                {(['expense', 'income'] as const).map((t) => (
                  <TouchableOpacity key={t} onPress={() => setForm({ ...form, type: t })} style={[styles.typeBtn, { backgroundColor: form.type === t ? colors.primary : colors.surfaceVariant }]}>
                    <Text style={{ color: form.type === t ? '#fff' : colors.textSecondary, fontWeight: '600' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input label="Amount" keyboardType="numeric" value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} />
              <Input label="Description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} />
              <Select label="Category" value={form.categoryId} options={categoryOptions} onChange={(v) => setForm({ ...form, categoryId: v })} />
              <Select label="Frequency" value={form.frequency} options={FREQUENCIES} onChange={(v) => setForm({ ...form, frequency: v })} />
              <Button title="Create" onPress={handleCreate} loading={createMutation.isPending} fullWidth />
            </ScrollView>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>

      <ConfirmDialog visible={!!deleteId} title="Delete" message="Delete this recurring item?" destructive onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} onCancel={() => setDeleteId(null)} loading={deleteMutation.isPending} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 80 },
  itemCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { fontSize: 15, fontWeight: '700' },
  itemMeta: { fontSize: 13, marginTop: 4 },
  itemAmount: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  sheetTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
});

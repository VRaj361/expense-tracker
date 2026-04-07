import React, { useState } from 'react';
import {
  View,
  Text,
  SectionList,
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
import { reminderAPI } from '../services/api';
import { EmptyState, Button, Input, Select, Badge } from '../components/ui';
import { formatCurrency, formatDate, FREQUENCIES } from '../utils/helpers';
import { useStore } from '../store/useStore';
import type { Reminder } from '../types';

export function RemindersScreen() {
  const colors = useThemeColors();
  const currency = useStore((s) => s.user?.currency) || 'INR';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', dueDate: '', frequency: 'once' as string, description: '' });

  const { data: reminders, isLoading, refetch } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => reminderAPI.getAll().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => reminderAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      Toast.show({ type: 'success', text1: 'Reminder created' });
      setShowForm(false);
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => reminderAPI.markPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      Toast.show({ type: 'success', text1: 'Marked as paid' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reminderAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      Toast.show({ type: 'success', text1: 'Deleted' });
    },
  });

  const [refreshing, setRefreshing] = useState(false);
  const allReminders: Reminder[] = reminders || [];
  const upcoming = allReminders.filter((r) => !r.isPaid);
  const paid = allReminders.filter((r) => r.isPaid);

  const sections = [
    ...(upcoming.length ? [{ title: 'Upcoming', data: upcoming }] : []),
    ...(paid.length ? [{ title: 'Paid', data: paid }] : []),
  ];

  const handleCreate = () => {
    if (!form.title || !form.amount) return;
    createMutation.mutate({
      title: form.title,
      amount: parseFloat(form.amount),
      dueDate: form.dueDate || new Date().toISOString(),
      frequency: form.frequency,
      description: form.description || undefined,
      notifyVia: ['inApp'],
    });
  };

  const FULL_FREQUENCIES = [{ value: 'once', label: 'Once' }, ...FREQUENCIES];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, backgroundColor: colors.background }]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <View style={[styles.reminderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.reminderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reminderTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.reminderMeta, { color: colors.textSecondary }]}>
                  Due: {formatDate(item.dueDate)} · {item.frequency}
                </Text>
              </View>
              <Text style={[styles.reminderAmount, { color: colors.text }]}>
                {formatCurrency(item.amount, currency)}
              </Text>
            </View>
            {!item.isPaid && (
              <View style={styles.reminderActions}>
                <TouchableOpacity onPress={() => markPaidMutation.mutate(item._id)} style={[styles.actionBtn, { backgroundColor: colors.success + '15' }]}>
                  <Ionicons name="checkmark" size={16} color={colors.success} />
                  <Text style={{ color: colors.success, fontSize: 13, fontWeight: '600' }}>Mark Paid</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteMutation.mutate(item._id)} style={[styles.actionBtn, { backgroundColor: colors.error + '15' }]}>
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} />}
        ListEmptyComponent={
          isLoading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} /> :
            <EmptyState icon="alarm-outline" title="No reminders" description="Set payment reminders" actionLabel="Add Reminder" onAction={() => setShowForm(true)} />
        }
      />

      <TouchableOpacity onPress={() => setShowForm(true)} style={[styles.fab, { backgroundColor: colors.primary }]}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showForm} transparent animationType="slide">
        <TouchableOpacity style={[styles.overlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={() => setShowForm(false)}>
          <SafeAreaView style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <ScrollView>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Reminder</Text>
              <Input label="Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} placeholder="e.g. Rent payment" />
              <Input label="Amount" keyboardType="numeric" value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} />
              <Select label="Frequency" value={form.frequency} options={FULL_FREQUENCIES} onChange={(v) => setForm({ ...form, frequency: v })} />
              <Input label="Description (optional)" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} />
              <Button title="Create Reminder" onPress={handleCreate} loading={createMutation.isPending} fullWidth />
            </ScrollView>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 80 },
  sectionTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, paddingVertical: 8, paddingHorizontal: 4 },
  reminderCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  reminderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reminderTitle: { fontSize: 15, fontWeight: '700' },
  reminderMeta: { fontSize: 13, marginTop: 4 },
  reminderAmount: { fontSize: 16, fontWeight: '700' },
  reminderActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  sheetTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
});

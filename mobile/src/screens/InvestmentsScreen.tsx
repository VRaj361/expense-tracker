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
import { investmentAPI } from '../services/api';
import { Card, EmptyState, Button, Input, Select, ConfirmDialog } from '../components/ui';
import { formatCurrency, INVESTMENT_TYPES } from '../utils/helpers';
import { useStore } from '../store/useStore';
import type { Investment } from '../types';

export function InvestmentsScreen() {
  const colors = useThemeColors();
  const currency = useStore((s) => s.user?.currency) || 'INR';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', type: 'stocks' as string, investedAmount: '', currentValue: '', units: '', notes: '' });

  const { data: investments, isLoading, refetch } = useQuery({
    queryKey: ['investments'],
    queryFn: () => investmentAPI.getAll().then((r) => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['investment-summary'],
    queryFn: () => investmentAPI.getSummary().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => investmentAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investment-summary'] });
      Toast.show({ type: 'success', text1: 'Investment added' });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => investmentAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      Toast.show({ type: 'success', text1: 'Investment deleted' });
      setDeleteId(null);
    },
  });

  const [refreshing, setRefreshing] = useState(false);

  const handleCreate = () => {
    if (!form.name || !form.investedAmount) return;
    createMutation.mutate({
      name: form.name,
      type: form.type,
      investedAmount: parseFloat(form.investedAmount),
      currentValue: parseFloat(form.currentValue) || parseFloat(form.investedAmount),
      units: form.units ? parseFloat(form.units) : undefined,
      notes: form.notes || undefined,
    });
  };

  const renderInvestment = ({ item }: { item: Investment }) => {
    const gain = item.currentValue - item.investedAmount;
    const gainPct = item.investedAmount > 0 ? (gain / item.investedAmount) * 100 : 0;
    const isPositive = gain >= 0;

    return (
      <TouchableOpacity
        onPress={() => setDeleteId(item._id)}
        style={[styles.investCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.investHeader}>
          <Text style={[styles.investName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.investType, { color: colors.textSecondary }]}>
            {INVESTMENT_TYPES.find((t) => t.value === item.type)?.label || item.type}
          </Text>
        </View>
        <View style={styles.investRow}>
          <View>
            <Text style={[styles.investLabel, { color: colors.textSecondary }]}>Invested</Text>
            <Text style={[styles.investValue, { color: colors.text }]}>{formatCurrency(item.investedAmount, currency)}</Text>
          </View>
          <View>
            <Text style={[styles.investLabel, { color: colors.textSecondary }]}>Current</Text>
            <Text style={[styles.investValue, { color: colors.text }]}>{formatCurrency(item.currentValue, currency)}</Text>
          </View>
          <View>
            <Text style={[styles.investLabel, { color: colors.textSecondary }]}>Return</Text>
            <Text style={[styles.investValue, { color: isPositive ? colors.income : colors.expense }]}>
              {isPositive ? '+' : ''}{gainPct.toFixed(1)}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {summary && (
        <View style={styles.summaryRow}>
          <Card style={{ flex: 1, marginRight: 6 }} padding={12}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Invested</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(summary.totalInvested || 0, currency)}</Text>
          </Card>
          <Card style={{ flex: 1, marginLeft: 6 }} padding={12}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Current Value</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(summary.totalCurrent || 0, currency)}</Text>
          </Card>
        </View>
      )}

      <FlatList
        data={investments || []}
        keyExtractor={(item: Investment) => item._id}
        renderItem={renderInvestment}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} />
        }
        ListEmptyComponent={
          isLoading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} /> :
            <EmptyState icon="trending-up-outline" title="No investments" description="Track your investment portfolio" actionLabel="Add Investment" onAction={() => setShowForm(true)} />
        }
      />

      <TouchableOpacity onPress={() => setShowForm(true)} style={[styles.fab, { backgroundColor: colors.primary }]}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showForm} transparent animationType="slide">
        <TouchableOpacity style={[styles.overlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={() => setShowForm(false)}>
          <SafeAreaView style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <ScrollView>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Investment</Text>
              <Input label="Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="e.g. HDFC Nifty 50" />
              <Select label="Type" value={form.type} options={INVESTMENT_TYPES} onChange={(v) => setForm({ ...form, type: v })} />
              <Input label="Invested Amount" keyboardType="numeric" value={form.investedAmount} onChangeText={(v) => setForm({ ...form, investedAmount: v })} />
              <Input label="Current Value" keyboardType="numeric" value={form.currentValue} onChangeText={(v) => setForm({ ...form, currentValue: v })} />
              <Input label="Units (optional)" keyboardType="numeric" value={form.units} onChangeText={(v) => setForm({ ...form, units: v })} />
              <Input label="Notes (optional)" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} />
              <Button title="Add Investment" onPress={handleCreate} loading={createMutation.isPending} fullWidth />
            </ScrollView>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>

      <ConfirmDialog visible={!!deleteId} title="Delete Investment" message="Are you sure?" destructive onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} onCancel={() => setDeleteId(null)} loading={deleteMutation.isPending} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryRow: { flexDirection: 'row', padding: 16, paddingBottom: 0 },
  summaryLabel: { fontSize: 12, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 80 },
  investCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  investHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  investName: { fontSize: 16, fontWeight: '700' },
  investType: { fontSize: 12 },
  investRow: { flexDirection: 'row', justifyContent: 'space-between' },
  investLabel: { fontSize: 12, marginBottom: 2 },
  investValue: { fontSize: 14, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  sheetTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
});

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
import { loanAPI } from '../services/api';
import { LoanCard } from '../components/LoanCard';
import { EmptyState, Button, Input, Select, ConfirmDialog } from '../components/ui';
import type { Loan } from '../types';

const LOAN_TYPES = [
  { value: 'home', label: 'Home Loan' },
  { value: 'car', label: 'Car Loan' },
  { value: 'personal', label: 'Personal Loan' },
  { value: 'education', label: 'Education Loan' },
  { value: 'other', label: 'Other' },
];

export function LoansScreen() {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [payId, setPayId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    loanType: '',
    loanAmount: '',
    interestRate: '',
    emiAmount: '',
    tenure: '',
    emiDay: '1',
  });

  const { data: loans, isLoading, refetch } = useQuery({
    queryKey: ['loans'],
    queryFn: () => loanAPI.getAll().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => loanAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      Toast.show({ type: 'success', text1: 'Loan added' });
      setShowForm(false);
    },
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => loanAPI.recordPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      Toast.show({ type: 'success', text1: 'EMI recorded' });
      setPayId(null);
    },
  });

  const [refreshing, setRefreshing] = useState(false);

  const handleCreate = () => {
    if (!form.name || !form.loanAmount || !form.emiAmount) return;
    createMutation.mutate({
      name: form.name,
      loanType: form.loanType || 'other',
      loanAmount: parseFloat(form.loanAmount),
      interestRate: parseFloat(form.interestRate) || 0,
      emiAmount: parseFloat(form.emiAmount),
      tenure: parseInt(form.tenure) || 12,
      emiDay: parseInt(form.emiDay) || 1,
      startDate: new Date().toISOString(),
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={loans || []}
        keyExtractor={(item: Loan) => item._id}
        renderItem={({ item }) => (
          <LoanCard loan={item} onPayEmi={() => setPayId(item._id)} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
          ) : (
            <EmptyState
              icon="business-outline"
              title="No loans tracked"
              description="Add your loans to track EMI payments"
              actionLabel="Add Loan"
              onAction={() => setShowForm(true)}
            />
          )
        }
      />

      <TouchableOpacity
        onPress={() => setShowForm(true)}
        style={[styles.fab, { backgroundColor: colors.primary }]}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showForm} transparent animationType="slide">
        <TouchableOpacity
          style={[styles.overlay, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={() => setShowForm(false)}
        >
          <SafeAreaView style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <ScrollView>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Loan</Text>
              <Input label="Loan Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="e.g. Home Loan" />
              <Select label="Loan Type" value={form.loanType} options={LOAN_TYPES} onChange={(v) => setForm({ ...form, loanType: v })} />
              <Input label="Loan Amount" keyboardType="numeric" value={form.loanAmount} onChangeText={(v) => setForm({ ...form, loanAmount: v })} placeholder="Total amount" />
              <Input label="Interest Rate (%)" keyboardType="numeric" value={form.interestRate} onChangeText={(v) => setForm({ ...form, interestRate: v })} placeholder="Annual rate" />
              <Input label="EMI Amount" keyboardType="numeric" value={form.emiAmount} onChangeText={(v) => setForm({ ...form, emiAmount: v })} placeholder="Monthly EMI" />
              <Input label="Tenure (months)" keyboardType="numeric" value={form.tenure} onChangeText={(v) => setForm({ ...form, tenure: v })} placeholder="Total months" />
              <Button title="Add Loan" onPress={handleCreate} loading={createMutation.isPending} fullWidth />
            </ScrollView>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>

      <ConfirmDialog
        visible={!!payId}
        title="Record EMI Payment"
        message="Mark this month's EMI as paid?"
        confirmLabel="Record Payment"
        onConfirm={() => payId && payMutation.mutate(payId)}
        onCancel={() => setPayId(null)}
        loading={payMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 80 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
  },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  sheetTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
});

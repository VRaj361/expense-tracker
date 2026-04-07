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
import { budgetAPI, categoryAPI } from '../services/api';
import { BudgetCard } from '../components/BudgetCard';
import { EmptyState, Button, Input, Select, ConfirmDialog } from '../components/ui';
import { useStore } from '../store/useStore';
import type { Budget } from '../types';

export function BudgetsScreen() {
  const colors = useThemeColors();
  const currency = useStore((s) => s.user?.currency) || 'INR';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ categoryId: '', limit: '', startDate: '', endDate: '' });

  const { data: budgets, isLoading, refetch } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetAPI.getAll().then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => budgetAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      Toast.show({ type: 'success', text1: 'Budget created' });
      setShowForm(false);
      setFormData({ categoryId: '', limit: '', startDate: '', endDate: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      Toast.show({ type: 'success', text1: 'Budget deleted' });
      setDeleteId(null);
    },
  });

  const [refreshing, setRefreshing] = useState(false);

  const handleCreate = () => {
    if (!formData.limit) return;
    const cat = categories?.find((c: any) => c._id === formData.categoryId);
    const now = new Date();
    createMutation.mutate({
      categoryId: formData.categoryId || undefined,
      categoryName: cat?.name,
      limit: parseFloat(formData.limit),
      startDate: formData.startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      endDate: formData.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
    });
  };

  const categoryOptions = (categories || []).map((c: any) => ({ value: c._id, label: c.name }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={budgets || []}
        keyExtractor={(item: Budget) => item._id}
        renderItem={({ item }) => (
          <BudgetCard
            budget={item}
            currency={currency}
            onPress={() => setDeleteId(item._id)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refetch();
              setRefreshing(false);
            }}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
          ) : (
            <EmptyState
              icon="pie-chart-outline"
              title="No budgets yet"
              description="Create a budget to track your spending limits"
              actionLabel="Create Budget"
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
              <Text style={[styles.sheetTitle, { color: colors.text }]}>New Budget</Text>
              <Select
                label="Category (optional)"
                placeholder="Overall budget"
                value={formData.categoryId}
                options={categoryOptions}
                onChange={(v) => setFormData({ ...formData, categoryId: v })}
              />
              <Input
                label="Spending Limit"
                placeholder="Enter amount"
                keyboardType="numeric"
                value={formData.limit}
                onChangeText={(v) => setFormData({ ...formData, limit: v })}
              />
              <Button
                title="Create Budget"
                onPress={handleCreate}
                loading={createMutation.isPending}
                fullWidth
              />
            </ScrollView>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>

      <ConfirmDialog
        visible={!!deleteId}
        title="Delete Budget"
        message="Are you sure?"
        destructive
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 80 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
});

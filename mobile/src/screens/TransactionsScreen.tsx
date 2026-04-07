import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';
import { expenseAPI } from '../services/api';
import { TransactionItem } from '../components/TransactionItem';
import { EmptyState, ConfirmDialog } from '../components/ui';
import { useStore } from '../store/useStore';
import Toast from 'react-native-toast-message';
import type { Expense } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export function TransactionsScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const currency = useStore((s) => s.user?.currency) || 'INR';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['transactions', page, search],
    queryFn: () =>
      expenseAPI
        .getAll({ page, limit: 20, search: search || undefined })
        .then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });
      Toast.show({ type: 'success', text1: 'Transaction deleted' });
      setDeleteId(null);
    },
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const transactions: Expense[] = data?.data || data || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          placeholder="Search transactions..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, { color: colors.text }]}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TransactionItem
              item={item}
              currency={currency}
              onPress={() => navigation.navigate('AddTransaction', { transaction: item })}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No transactions found"
              description="Add your first transaction to get started"
              actionLabel="Add Transaction"
              onAction={() => navigation.navigate('AddTransaction')}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        onPress={() => navigation.navigate('AddTransaction')}
        style={[styles.fab, { backgroundColor: colors.primary }]}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <ConfirmDialog
        visible={!!deleteId}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction?"
        destructive
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
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
});

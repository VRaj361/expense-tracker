import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme';
import { formatCurrency, formatDateShort, CATEGORY_ICONS } from '../utils/helpers';
import type { Expense } from '../types';

interface TransactionItemProps {
  item: Expense;
  onPress?: () => void;
  currency?: string;
}

export function TransactionItem({ item, onPress, currency = 'INR' }: TransactionItemProps) {
  const colors = useThemeColors();
  const isIncome = item.type === 'income';
  const icon = CATEGORY_ICONS[item.categoryName?.toLowerCase() || 'other'] || '📦';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={[styles.container, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.icon, { backgroundColor: colors.surfaceVariant }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.desc, { color: colors.text }]} numberOfLines={1}>
          {item.description || item.categoryName || 'Transaction'}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {item.categoryName || 'Uncategorized'} · {formatDateShort(item.date)}
        </Text>
      </View>
      <Text
        style={[
          styles.amount,
          { color: isIncome ? colors.income : colors.expense },
        ]}
      >
        {isIncome ? '+' : '-'}{formatCurrency(item.amount, currency)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  desc: {
    fontSize: 15,
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
});

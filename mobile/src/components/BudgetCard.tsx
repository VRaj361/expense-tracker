import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeColors } from '../theme';
import { ProgressBar } from './ui/ProgressBar';
import { formatCurrency } from '../utils/helpers';
import type { Budget } from '../types';

interface BudgetCardProps {
  budget: Budget;
  onPress?: () => void;
  currency?: string;
}

export function BudgetCard({ budget, onPress, currency = 'INR' }: BudgetCardProps) {
  const colors = useThemeColors();
  const pct = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <Text style={[styles.name, { color: colors.text }]}>
          {budget.categoryName || 'Overall'}
        </Text>
        <Text style={[styles.limit, { color: colors.textSecondary }]}>
          {formatCurrency(budget.spent, currency)} / {formatCurrency(budget.limit, currency)}
        </Text>
      </View>
      <ProgressBar progress={pct} showPercentage={false} />
      <Text
        style={[
          styles.remaining,
          { color: pct >= 100 ? colors.error : colors.textSecondary },
        ]}
      >
        {pct >= 100
          ? `Over budget by ${formatCurrency(budget.spent - budget.limit, currency)}`
          : `${formatCurrency(budget.limit - budget.spent, currency)} remaining`}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  limit: {
    fontSize: 13,
  },
  remaining: {
    fontSize: 12,
    marginTop: 8,
  },
});

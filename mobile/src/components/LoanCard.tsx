import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';
import { ProgressBar } from './ui/ProgressBar';
import { formatCurrency, formatDate } from '../utils/helpers';
import type { Loan } from '../types';

interface LoanCardProps {
  loan: Loan;
  onPress?: () => void;
  onPayEmi?: () => void;
  currency?: string;
}

export function LoanCard({ loan, onPress, onPayEmi, currency = 'INR' }: LoanCardProps) {
  const colors = useThemeColors();
  const progress = loan.tenure > 0 ? (loan.paidEmis / loan.tenure) * 100 : 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>{loan.name}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {loan.loanType} · {loan.interestRate}% p.a.
          </Text>
        </View>
        {onPayEmi && loan.isActive && (
          <TouchableOpacity
            onPress={onPayEmi}
            style={[styles.payBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="card-outline" size={14} color="#fff" />
            <Text style={styles.payText}>Pay EMI</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>EMI</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatCurrency(loan.emiAmount, currency)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Remaining</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatCurrency(loan.remainingBalance, currency)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Next EMI</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {loan.nextEmiDate ? formatDate(loan.nextEmiDate) : '-'}
          </Text>
        </View>
      </View>

      <ProgressBar
        progress={progress}
        label={`${loan.paidEmis} of ${loan.tenure} EMIs paid`}
        color={colors.primary}
      />
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  payText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});

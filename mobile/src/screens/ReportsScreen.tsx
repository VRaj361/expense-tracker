import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Toast from 'react-native-toast-message';
import { encode } from 'base64-arraybuffer';
import { useThemeColors } from '../theme';
import { expenseAPI, exportAPI } from '../services/api';
import { Card, Button } from '../components/ui';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';
import { TrendBarChart } from '../components/charts/TrendBarChart';
import { formatCurrency } from '../utils/helpers';
import { useStore } from '../store/useStore';

export function ReportsScreen() {
  const colors = useThemeColors();
  const currency = useStore((s) => s.user?.currency) || 'INR';
  const [exporting, setExporting] = useState<string | null>(null);

  const { data: overview, isLoading } = useQuery({
    queryKey: ['overview'],
    queryFn: () => expenseAPI.getOverview().then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['category-breakdown'],
    queryFn: () => expenseAPI.getCategoryBreakdown().then((r) => r.data),
  });

  const { data: trends } = useQuery({
    queryKey: ['monthly-trends'],
    queryFn: () => expenseAPI.getMonthlyTrends(12).then((r) => r.data),
  });

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setExporting(format);
    try {
      const response = await exportAPI[format]({});
      const ext = format === 'excel' ? 'xlsx' : format;
      const fileUri = `${FileSystem.cacheDirectory}fintrack-export.${ext}`;
      const base64 = encode(response.data as ArrayBuffer);
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(fileUri);

      Toast.show({ type: 'success', text1: 'Export ready' });
    } catch {
      Toast.show({ type: 'error', text1: 'Export failed' });
    } finally {
      setExporting(null);
    }
  };

  const trendsArr = Array.isArray(trends) ? trends : [];

  if (isLoading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Card title="Summary">
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Income</Text>
            <Text style={[styles.summaryValue, { color: colors.income }]}>
              {formatCurrency(overview?.totalIncome || 0, currency)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Expenses</Text>
            <Text style={[styles.summaryValue, { color: colors.expense }]}>
              {formatCurrency(overview?.totalExpenses || 0, currency)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Net Balance</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatCurrency(overview?.totalBalance || 0, currency)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Transactions</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {overview?.transactionCount || 0}
            </Text>
          </View>
        </View>
      </Card>

      <Card title="Category Breakdown">
        <CategoryPieChart data={Array.isArray(categories) ? categories : []} />
      </Card>

      {trendsArr.length > 0 && (
        <Card title="Monthly Trends (12 months)">
          <TrendBarChart
            incomeData={trendsArr.map((t: any) => Number(t.income) || 0)}
            expenseData={trendsArr.map((t: any) => Number(t.expenses) || 0)}
            labels={trendsArr.map((t: any) => String(t.month ?? '').slice(-2))}
          />
        </Card>
      )}

      <Card title="Export Data">
        <View style={styles.exportRow}>
          {(['csv', 'excel', 'pdf'] as const).map((fmt) => (
            <Button
              key={fmt}
              title={fmt.toUpperCase()}
              onPress={() => handleExport(fmt)}
              variant="outline"
              size="sm"
              loading={exporting === fmt}
              icon={
                <Ionicons
                  name={fmt === 'pdf' ? 'document-text-outline' : 'download-outline'}
                  size={16}
                  color={colors.primary}
                />
              }
              style={{ flex: 1, marginHorizontal: 4 }}
            />
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  summaryItem: { width: '50%', paddingVertical: 8 },
  summaryLabel: { fontSize: 12, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  exportRow: { flexDirection: 'row' },
});

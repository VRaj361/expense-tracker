import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useThemeColors } from '../theme';
import { expenseAPI } from '../services/api';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/helpers';
import { StatCard } from '../components/StatCard';
import { TransactionItem } from '../components/TransactionItem';
import { Card } from '../components/ui';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';
import { TrendBarChart } from '../components/charts/TrendBarChart';
import { WeeklyLineChart } from '../components/charts/WeeklyLineChart';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export function DashboardScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const user = useStore((s) => s.user);

  const { data: overview, isLoading, refetch } = useQuery({
    queryKey: ['overview'],
    queryFn: () => expenseAPI.getOverview().then((r) => r.data),
  });

  const { data: recentTxns } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => expenseAPI.getRecent(5).then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['category-breakdown'],
    queryFn: () => expenseAPI.getCategoryBreakdown().then((r) => r.data),
  });

  const { data: trends } = useQuery({
    queryKey: ['monthly-trends'],
    queryFn: () => expenseAPI.getMonthlyTrends(6).then((r) => r.data),
  });

  const { data: weekly } = useQuery({
    queryKey: ['weekly-spending'],
    queryFn: () => expenseAPI.getWeeklySpending().then((r) => r.data),
  });

  const { data: prediction } = useQuery({
    queryKey: ['prediction'],
    queryFn: () => expenseAPI.getPrediction().then((r) => r.data),
  });

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const currency = user?.currency || 'INR';
  const trendsArr = Array.isArray(trends) ? trends : [];
  const weeklyArr = Array.isArray(weekly) ? weekly : [];

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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.greeting, { color: colors.text }]}>
        Hi, {user?.name?.split(' ')[0] || 'there'}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
        <StatCard
          title="Balance"
          value={formatCurrency(overview?.totalBalance || 0, currency)}
          icon="wallet-outline"
          iconColor={colors.primary}
        />
        <View style={{ width: 12 }} />
        <StatCard
          title="Income"
          value={formatCurrency(overview?.monthlyIncome || 0, currency)}
          icon="trending-up-outline"
          iconColor={colors.income}
        />
        <View style={{ width: 12 }} />
        <StatCard
          title="Expenses"
          value={formatCurrency(overview?.monthlyExpenses || 0, currency)}
          icon="trending-down-outline"
          iconColor={colors.expense}
        />
        <View style={{ width: 12 }} />
        <StatCard
          title="Savings"
          value={formatCurrency(overview?.monthlySavings || 0, currency)}
          icon="shield-checkmark-outline"
          iconColor={colors.success}
        />
      </ScrollView>

      {prediction && (
        <Card title="AI Prediction" style={{ marginTop: 4 }}>
          <View style={styles.predRow}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
            <Text style={[styles.predText, { color: colors.textSecondary }]}>
              Predicted expenses:{' '}
              <Text style={{ fontWeight: '700', color: colors.text }}>
                {formatCurrency(prediction.predictedExpenses, currency)}
              </Text>
              {' · Trend: '}
              <Text
                style={{
                  fontWeight: '700',
                  color:
                    prediction.trend === 'decreasing'
                      ? colors.success
                      : prediction.trend === 'increasing'
                      ? colors.error
                      : colors.warning,
                }}
              >
                {prediction.trend}
              </Text>
            </Text>
          </View>
        </Card>
      )}

      <Card title="Spending by Category">
        <CategoryPieChart data={Array.isArray(categories) ? categories : []} />
      </Card>

      {trendsArr.length > 0 && (
        <Card title="Monthly Trends">
          <TrendBarChart
            incomeData={trendsArr.map((t: any) => Number(t.income) || 0)}
            expenseData={trendsArr.map((t: any) => Number(t.expenses) || 0)}
            labels={trendsArr.map((t: any) => String(t.month ?? '').slice(-2))}
          />
        </Card>
      )}

      {weeklyArr.length > 0 && (
        <Card title="Weekly Spending">
          <WeeklyLineChart
            data={weeklyArr.map((w: any) => Number(w.total) || 0)}
            labels={weeklyArr.map((w: any) => String(w.day ?? '').slice(0, 3))}
          />
        </Card>
      )}

      <Card title="Recent Transactions">
        {recentTxns?.length ? (
          recentTxns.map((txn: any) => (
            <TransactionItem
              key={txn._id}
              item={txn}
              currency={currency}
              onPress={() => navigation.navigate('AddTransaction', { transaction: txn })}
            />
          ))
        ) : (
          <Text style={[styles.noData, { color: colors.textSecondary }]}>
            No recent transactions
          </Text>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  predRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  predText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  noData: {
    textAlign: 'center',
    paddingVertical: 16,
  },
});

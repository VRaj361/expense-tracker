import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useThemeColors } from '../../theme';

const CHART_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
];

interface PieChartData {
  _id: string;
  categoryName: string;
  total: number;
}

interface CategoryPieChartProps {
  data: PieChartData[];
  title?: string;
}

export function CategoryPieChart({ data, title }: CategoryPieChartProps) {
  const colors = useThemeColors();
  const screenWidth = Dimensions.get('window').width - 64;

  const validData = (data || []).filter(
    (item) => item && typeof item.total === 'number' && item.total > 0,
  );

  if (!validData.length) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: colors.textSecondary }}>No category data</Text>
      </View>
    );
  }

  const chartData = validData.slice(0, 8).map((item, i) => ({
    name: item.categoryName || 'Other',
    amount: item.total,
    color: CHART_COLORS[i % CHART_COLORS.length],
    legendFontColor: colors.textSecondary,
    legendFontSize: 12,
  }));

  return (
    <View>
      {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
      <PieChart
        data={chartData}
        width={screenWidth}
        height={180}
        chartConfig={{
          color: () => colors.text,
        }}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="0"
        absolute
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  empty: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

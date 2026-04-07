import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useThemeColors } from '../../theme';

interface TrendBarChartProps {
  incomeData: number[];
  expenseData: number[];
  labels: string[];
  title?: string;
}

export function TrendBarChart({ incomeData, expenseData, labels, title }: TrendBarChartProps) {
  const colors = useThemeColors();
  const screenWidth = Dimensions.get('window').width - 64;

  const safeExpense = (expenseData || []).map((v) =>
    typeof v === 'number' && isFinite(v) ? v : 0,
  );
  const safeLabels = (labels || []).slice(-6);
  const chartValues = safeExpense.slice(-6);

  if (!chartValues.length || (chartValues.every((v) => v === 0) && safeLabels.length === 0)) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: colors.textSecondary }}>No trend data</Text>
      </View>
    );
  }

  const finalData = chartValues.length ? chartValues : [0];
  const finalLabels = safeLabels.length ? safeLabels : finalData.map((_, i) => String(i + 1));

  return (
    <View>
      {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
      <BarChart
        data={{
          labels: finalLabels,
          datasets: [{ data: finalData }],
        }}
        width={screenWidth}
        height={200}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: colors.card,
          backgroundGradientFrom: colors.card,
          backgroundGradientTo: colors.card,
          decimalPlaces: 0,
          color: () => colors.primary,
          labelColor: () => colors.textSecondary,
          barPercentage: 0.6,
          propsForLabels: { fontSize: 10 },
        }}
        style={styles.chart}
        fromZero
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
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  empty: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

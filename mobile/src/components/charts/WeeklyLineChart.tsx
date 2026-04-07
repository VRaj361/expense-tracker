import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useThemeColors } from '../../theme';

interface WeeklyLineChartProps {
  data: number[];
  labels: string[];
  title?: string;
}

export function WeeklyLineChart({ data, labels, title }: WeeklyLineChartProps) {
  const colors = useThemeColors();
  const screenWidth = Dimensions.get('window').width - 64;

  const safeData = (data || []).map((v) =>
    typeof v === 'number' && isFinite(v) ? v : 0,
  );
  const safeLabels = (labels || []).slice(0, safeData.length || 1);

  if (!safeData.length) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: colors.textSecondary }}>No weekly data</Text>
      </View>
    );
  }

  return (
    <View>
      {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
      <LineChart
        data={{
          labels: safeLabels.length ? safeLabels : safeData.map((_, i) => String(i + 1)),
          datasets: [{ data: safeData }],
        }}
        width={screenWidth}
        height={200}
        chartConfig={{
          backgroundColor: colors.card,
          backgroundGradientFrom: colors.card,
          backgroundGradientTo: colors.card,
          decimalPlaces: 0,
          color: () => colors.primary,
          labelColor: () => colors.textSecondary,
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: colors.primary,
          },
          propsForLabels: { fontSize: 10 },
        }}
        bezier
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

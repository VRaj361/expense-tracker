import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../../theme';

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
  height?: number;
}

export function ProgressBar({
  progress,
  label,
  showPercentage = true,
  color,
  height = 8,
}: ProgressBarProps) {
  const colors = useThemeColors();
  const pct = Math.min(Math.max(progress, 0), 100);

  const barColor =
    color ?? (pct >= 100 ? colors.error : pct >= 80 ? colors.warning : colors.primary);

  return (
    <View style={styles.container}>
      {(label || showPercentage) && (
        <View style={styles.labelRow}>
          {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
          {showPercentage && (
            <Text style={[styles.pct, { color: colors.textSecondary }]}>{Math.round(pct)}%</Text>
          )}
        </View>
      )}
      <View style={[styles.track, { height, backgroundColor: colors.surfaceVariant }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${pct}%`,
              height,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
  },
  pct: {
    fontSize: 13,
    fontWeight: '600',
  },
  track: {
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 99,
  },
});

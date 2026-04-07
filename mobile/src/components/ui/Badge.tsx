import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../../theme';

interface BadgeProps {
  text: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

export function Badge({ text, variant = 'default' }: BadgeProps) {
  const colors = useThemeColors();

  const bgMap: Record<string, string> = {
    default: colors.surfaceVariant,
    success: colors.success + '20',
    error: colors.error + '20',
    warning: colors.warning + '20',
    info: colors.primary + '20',
  };

  const textMap: Record<string, string> = {
    default: colors.textSecondary,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.primary,
  };

  return (
    <View style={[styles.badge, { backgroundColor: bgMap[variant] }]}>
      <Text style={[styles.text, { color: textMap[variant] }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

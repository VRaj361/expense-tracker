import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useThemeColors } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  padding?: number;
}

export function Card({ children, title, subtitle, style, padding = 16 }: CardProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          padding,
        },
        style,
      ]}
    >
      {title && (
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          )}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});

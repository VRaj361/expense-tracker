import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';

interface StatCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ title, value, icon, iconColor, trend, trendUp }: StatCardProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: (iconColor || colors.primary) + '15' }]}>
          <Ionicons name={icon} size={20} color={iconColor || colors.primary} />
        </View>
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <View style={styles.footer}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
        {trend && (
          <Text style={{ color: trendUp ? colors.success : colors.error, fontSize: 12, fontWeight: '600' }}>
            {trend}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flex: 1,
    minWidth: 140,
  },
  header: {
    marginBottom: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
  },
});

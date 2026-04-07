import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={56} color={colors.textTertiary} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {description && (
        <Text style={[styles.desc, { color: colors.textSecondary }]}>{description}</Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} size="sm" style={{ marginTop: 16 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

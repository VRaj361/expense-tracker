import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeColors } from '../../theme';
import { Button } from './Button';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  const colors = useThemeColors();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        activeOpacity={1}
        onPress={onCancel}
      >
        <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          <View style={styles.actions}>
            <Button
              title={cancelLabel}
              onPress={onCancel}
              variant="secondary"
              size="sm"
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title={confirmLabel}
              onPress={onConfirm}
              variant={destructive ? 'danger' : 'primary'}
              size="sm"
              loading={loading}
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  dialog: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
  },
});

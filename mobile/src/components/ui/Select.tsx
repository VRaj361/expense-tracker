import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../theme';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  value?: string;
  options: readonly SelectOption[] | SelectOption[];
  onChange: (value: string) => void;
  error?: string;
}

export function Select({ label, placeholder = 'Select...', value, options, onChange, error }: SelectProps) {
  const [open, setOpen] = useState(false);
  const colors = useThemeColors();
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.surfaceVariant,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.triggerText,
            { color: selectedLabel ? colors.text : colors.textTertiary },
          ]}
        >
          {selectedLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}

      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity
          style={[styles.overlay, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <SafeAreaView style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{label || 'Select'}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options as SelectOption[]}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  style={[
                    styles.option,
                    {
                      backgroundColor:
                        item.value === value ? colors.primary + '15' : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: item.value === value ? colors.primary : colors.text,
                        fontWeight: item.value === value ? '600' : '400',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
  },
  triggerText: {
    fontSize: 15,
    flex: 1,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '60%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  optionText: {
    fontSize: 16,
  },
});

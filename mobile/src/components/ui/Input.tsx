import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useThemeColors } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
}

export function Input({ label, error, containerStyle, icon, style, ...props }: InputProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surfaceVariant,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
      >
        {icon && <View style={styles.icon}>{icon}</View>}
        <TextInput
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.input,
            { color: colors.text },
            icon ? { paddingLeft: 0 } : undefined,
            style,
          ]}
          {...props}
        />
      </View>
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});

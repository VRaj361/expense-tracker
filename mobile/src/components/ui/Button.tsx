import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useThemeColors } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const colors = useThemeColors();

  const bgColor: Record<string, string> = {
    primary: colors.primary,
    secondary: colors.surfaceVariant,
    outline: 'transparent',
    ghost: 'transparent',
    danger: colors.error,
  };

  const txtColor: Record<string, string> = {
    primary: '#ffffff',
    secondary: colors.text,
    outline: colors.primary,
    ghost: colors.primary,
    danger: '#ffffff',
  };

  const padV: Record<string, number> = { sm: 8, md: 12, lg: 16 };
  const padH: Record<string, number> = { sm: 12, md: 20, lg: 28 };
  const fontSize: Record<string, number> = { sm: 13, md: 15, lg: 17 };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: bgColor[variant],
          paddingVertical: padV[size],
          paddingHorizontal: padH[size],
          opacity: disabled ? 0.5 : 1,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: variant === 'outline' ? colors.primary : 'transparent',
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={txtColor[variant]} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { color: txtColor[variant], fontSize: fontSize[size] },
              icon ? { marginLeft: 8 } : undefined,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600',
  },
});

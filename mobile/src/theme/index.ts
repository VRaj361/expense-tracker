import { useColorScheme } from 'react-native';
import { Colors, type ThemeColors } from './colors';
import { useStore } from '../store/useStore';

export { Colors, type ThemeColors };

export function useThemeColors(): ThemeColors {
  const systemScheme = useColorScheme();
  const storeTheme = useStore((s) => s.theme);
  const theme = storeTheme ?? (systemScheme || 'light');
  return Colors[theme];
}

import { useColorScheme } from 'react-native';

// Values ported from res/values/colors.xml and res/values-night/colors.xml
export const palette = {
  light: {
    primary: '#db636f',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#212121',
    textSecondary: '#666666',
    outline: '#E0E0E0',
    surfaceVariant: '#F5F5F5',
    lightPink: '#FFF5F7',
    danger: '#D32F2F',
    onPrimary: '#FFFFFF',
  },
  dark: {
    primary: '#db636f',
    background: '#121212',
    surface: '#1E1E1E',
    card: '#2D2D2D',
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    outline: '#404040',
    surfaceVariant: '#2D2D2D',
    lightPink: '#FFF5F7',
    danger: '#EF5350',
    onPrimary: '#FFFFFF',
  },
};

export type Theme = typeof palette.light;

// Follows the system setting for now. The in-app dark mode switch comes with the Settings screen.
export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? palette.dark : palette.light;
}

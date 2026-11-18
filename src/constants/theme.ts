import { createContext, useContext } from 'react';

// UMatch brand colours: UMN dark blue (primary) and the blues used in the UMatch logo
export const palette = {
  light: {
    primary: '#0D346E', // UMN dark blue
    accent: '#0661C6', // logo blue
    accentLight: '#4E89CE', // logo light blue
    background: '#F5F8FC',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#212121',
    textSecondary: '#666666',
    outline: '#D6E0EE',
    surfaceVariant: '#EEF3FA',
    tint: '#E8F0FB',
    danger: '#D32F2F',
    onPrimary: '#FFFFFF',
  },
  dark: {
    primary: '#3C7CC6', // lighter blue so it stays readable on dark surfaces
    accent: '#0661C6',
    accentLight: '#4E89CE',
    background: '#0E1520',
    surface: '#162131',
    card: '#1D2B40',
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    outline: '#2E405A',
    surfaceVariant: '#1D2B40',
    tint: '#16304F',
    danger: '#EF5350',
    onPrimary: '#FFFFFF',
  },
};

export type Theme = typeof palette.light;

export interface ThemeState {
  theme: Theme;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  ready: boolean; // the saved choice has been read from storage
}

export const ThemeContext = createContext<ThemeState>({
  theme: palette.light,
  darkMode: false,
  setDarkMode: () => {},
  ready: true,
});

export const useTheme = () => useContext(ThemeContext).theme;
export const useThemeSettings = () => useContext(ThemeContext);

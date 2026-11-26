import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useThemeSettings } from '../constants/theme';

const rgba = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

/**
 * Website only: replaces the browser's grey scrollbar (with its arrow buttons) by a slim rounded one in the app's blue,
 * on a transparent track so the page colour shows through, and follows the light / dark theme. Phones have no
 * scrollbar to style, so it renders nothing there.
 */
export function WebScrollbar() {
  const { theme, darkMode } = useThemeSettings();
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const thumb = rgba(theme.primary, darkMode ? 0.55 : 0.35);
    const thumbHover = rgba(theme.primary, darkMode ? 0.85 : 0.6);
    let el = document.getElementById('umatch-scrollbar') as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = 'umatch-scrollbar';
      document.head.appendChild(el);
    }
    el.textContent = `
      :root { color-scheme: ${darkMode ? 'dark' : 'light'}; }
      *::-webkit-scrollbar { width: 12px; height: 12px; }
      *::-webkit-scrollbar-track, *::-webkit-scrollbar-corner { background: transparent; }
      *::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
      *::-webkit-scrollbar-thumb { background-color: ${thumb}; border-radius: 8px; border: 3px solid transparent; background-clip: content-box; }
      *::-webkit-scrollbar-thumb:hover { background-color: ${thumbHover}; }
      @supports not selector(::-webkit-scrollbar) {
        * { scrollbar-width: thin; scrollbar-color: ${thumb} transparent; }
      }
    `;
  }, [theme.primary, darkMode]);
  return null;
}

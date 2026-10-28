import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { palette, ThemeContext } from '../constants/theme';

const KEY = 'dark_mode'; // same key name the Android app used in its app_prefs

/** Like the Android app, the app is light by default and only goes dark when the switch in Settings is on. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkModeState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setDarkModeState(v === 'true'))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setDarkMode = useCallback((value: boolean) => {
    setDarkModeState(value);
    AsyncStorage.setItem(KEY, String(value)).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ theme: darkMode ? palette.dark : palette.light, darkMode, setDarkMode, ready }),
    [darkMode, setDarkMode, ready],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedScheme = 'light' | 'dark';

const STORAGE_KEY = 'splitit.themeMode';

type ThemeContextValue = {
  mode: ThemeMode;
  scheme: ResolvedScheme;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  // Load persisted mode once on mount.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (active && (value === 'light' || value === 'dark' || value === 'system')) {
        setModeState(value);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const scheme: ResolvedScheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo(() => ({ mode, scheme, setMode }), [mode, scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Resolved 'light' | 'dark', honoring the user's chosen mode. */
export function useResolvedScheme(): ResolvedScheme {
  const ctx = useContext(ThemeContext);
  return ctx?.scheme ?? 'light';
}

/** Read/write the theme mode (light | dark | system). */
export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { mode: 'system' as ThemeMode, scheme: 'light' as ResolvedScheme, setMode: () => {} };
  }
  return ctx;
}

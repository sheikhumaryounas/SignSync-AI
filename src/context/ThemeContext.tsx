import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyThemeMode, getThemeMode, ThemeMode } from '../theme';

// Appearance is a device setting (it also applies on the sign-in screens), so it is kept on the
// phone rather than in the synced user preferences.
const STORAGE_KEY = 'signsync.theme';

interface ThemeValue {
  mode: ThemeMode;
  isDark: boolean;
  /** False until the saved choice has been read, so the first frame uses the right colours. */
  ready: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getThemeMode());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .catch(() => null)
      .then((saved) => {
        if (saved === 'dark' || saved === 'light') {
          applyThemeMode(saved);
          setModeState(saved);
        }
        setReady(true);
      });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    // Swap the live palette before React re-renders so every style read picks it up.
    applyThemeMode(next);
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const value = useMemo(() => ({ mode, isDark: mode === 'dark', ready, setMode }), [mode, ready, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used inside ThemeProvider');
  return ctx;
}

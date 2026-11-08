import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, NavigationState } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NativeSplash from 'expo-splash-screen';
import { palette, useAppFonts } from './src/theme';
import SplashScreen from './src/screens/SplashScreen';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LanguageProvider } from './src/i18n';
import { PreferencesProvider } from './src/context/PreferencesContext';
import { FeedbackProvider } from './src/context/FeedbackContext';
import { PreviewProvider } from './src/context/PreviewContext';
import { ThemeProvider, useThemeMode } from './src/context/ThemeContext';

function MainAppContent() {
  const { status } = useAuth();
  const { mode, isDark } = useThemeMode();
  const [splashDone, setSplashDone] = useState(false);
  const finishSplash = useCallback(() => setSplashDone(true), []);
  // Kept so the navigator can be remounted on a theme switch without losing the current screen.
  const navState = useRef<NavigationState | undefined>(undefined);

  const navTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: palette.canvas,
        card: palette.surface,
        text: palette.ink,
        border: palette.line,
        primary: palette.navy,
      },
    };
  }, [isDark]);

  // The branded splash stays up until both its animation and session restore finish.
  if (!splashDone || status === 'loading') {
    return <SplashScreen onFinish={finishSplash} />;
  }

  // Styles are read when components render, so remounting the navigator (keyed on the theme)
  // repaints every screen with the new palette.
  return (
    <NavigationContainer
      key={mode}
      theme={navTheme}
      initialState={navState.current}
      onStateChange={(state) => {
        navState.current = state;
      }}
    >
      <RootNavigator />
    </NavigationContainer>
  );
}

NativeSplash.preventAutoHideAsync();

function ThemedApp() {
  const [fontsLoaded, fontError] = useAppFonts();
  const { ready: themeReady, isDark } = useThemeMode();
  const ready = (fontsLoaded || !!fontError) && themeReady;

  useEffect(() => {
    if (ready) NativeSplash.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <PreferencesProvider>
            <FeedbackProvider>
              <PreviewProvider>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <MainAppContent />
              </PreviewProvider>
            </FeedbackProvider>
          </PreferencesProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

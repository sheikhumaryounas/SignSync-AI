import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
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

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.canvas,
    card: palette.surface,
    text: palette.ink,
    border: palette.line,
    primary: palette.navy,
  },
};

function MainAppContent() {
  const { status } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const finishSplash = useCallback(() => setSplashDone(true), []);

  // The branded splash stays up until both its animation and session restore finish.
  if (!splashDone || status === 'loading') {
    return <SplashScreen onFinish={finishSplash} />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

NativeSplash.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useAppFonts();
  const ready = fontsLoaded || !!fontError;

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
                <StatusBar style="dark" />
                <MainAppContent />
              </PreviewProvider>
            </FeedbackProvider>
          </PreferencesProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

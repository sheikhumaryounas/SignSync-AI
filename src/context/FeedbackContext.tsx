import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { palette, spacing } from '../theme';
import { Notice, NoticeTone } from '../components/ui/Notice';
import { usePreferences } from './PreferencesContext';
import { useI18n } from '../i18n';

export interface FeedbackEvent {
  tone: NoticeTone;
  message: string;
  /** Spoken text when it should differ from the banner (shorter, or without symbols). */
  speak?: string;
}

export type FeedbackChannel = 'visual' | 'audio' | 'haptic';

interface FeedbackValue {
  /** One call fans out to every channel the user has on (SRS 3.1.6, EUC3). */
  notify: (event: FeedbackEvent) => void;
  /** Plays a single channel, used when the user switches it on in Preferences. */
  preview: (channel: FeedbackChannel, message: string) => void;
}

const FeedbackContext = createContext<FeedbackValue | undefined>(undefined);

const hapticFor: Record<NoticeTone, Haptics.NotificationFeedbackType> = {
  success: Haptics.NotificationFeedbackType.Success,
  info: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
};

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { prefs } = usePreferences();
  const { lang } = useI18n();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<FeedbackEvent | null>(null);
  const y = useRef(new Animated.Value(-120)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (event: FeedbackEvent) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast(event);
      Animated.spring(y, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
      hideTimer.current = setTimeout(() => {
        Animated.timing(y, { toValue: -120, duration: 220, useNativeDriver: true }).start(() => setToast(null));
      }, 2800);
    },
    [y]
  );

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const speak = useCallback(
    (text: string) => {
      Speech.stop().catch(() => undefined);
      Speech.speak(text, { language: lang === 'ur' ? 'ur-PK' : 'en-US', rate: 1 });
    },
    [lang]
  );

  // Read through a ref so a notify() fired right after saving uses the new channels.
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  const notify = useCallback(
    (event: FeedbackEvent) => {
      const p = prefsRef.current;
      if (p.visualFeedback) showToast(event);
      if (p.audioFeedback) speak(event.speak ?? event.message);
      if (p.hapticFeedback) Haptics.notificationAsync(hapticFor[event.tone]).catch(() => undefined);
    },
    [showToast, speak]
  );

  const preview = useCallback(
    (channel: FeedbackChannel, message: string) => {
      if (channel === 'visual') showToast({ tone: 'info', message });
      if (channel === 'audio') speak(message);
      if (channel === 'haptic') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    },
    [showToast, speak]
  );

  const value = useMemo(() => ({ notify, preview }), [notify, preview]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.toast, { top: insets.top + spacing.sm, transform: [{ translateY: y }] }]}
          accessibilityLiveRegion="polite"
        >
          <Notice tone={toast.tone} message={toast.message} />
        </Animated.View>
      ) : null}
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used inside FeedbackProvider');
  return ctx;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: 12,
    backgroundColor: palette.surface,
    boxShadow: '0px 12px 28px -10px rgba(0, 35, 88, 0.35)',
  },
});

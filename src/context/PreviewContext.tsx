// State for the FYP-2 preview screens (sign recognition, voice/text to sign, conversation).
// Those flows are still simulated, but what they produce is saved to the real history API so
// FYP-1 history shows genuine sessions. Committed modules never read this context.
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as Speech from 'expo-speech';
import { CommunicationSession, SignVocabularyItem, UserPreference } from '../types';
import { api, Modality, NewSession } from '../services/api';
import { defaultUserPreferences, mockVocabulary } from '../services/preview/mockData';
import { useAuth } from './AuthContext';
import { usePreferences } from './PreferencesContext';
import { isUrduText } from '../utils/format';

type LegacySession = Omit<CommunicationSession, 'id' | 'timestamp'>;

interface PreviewValue {
  preferences: UserPreference;
  vocabulary: SignVocabularyItem[];
  addSession: (session: LegacySession) => CommunicationSession;
  isSpeaking: boolean;
  /** `auto` marks speech the user did not ask for; it respects the audio-feedback setting. */
  speakText: (text: string, options?: { auto?: boolean }) => void;
  stopSpeaking: () => void;
}

const PreviewContext = createContext<PreviewValue | undefined>(undefined);

// "3m 20s" / "45s" → seconds; the previews report duration as text.
function parseDuration(text: string): number {
  const m = /(\d+)\s*m/.exec(text)?.[1];
  const s = /(\d+)\s*s/.exec(text)?.[1];
  return Number(m ?? 0) * 60 + Number(s ?? 0) || 30;
}

function toNewSession(s: LegacySession): NewSession {
  const ended = new Date();
  const started = new Date(ended.getTime() - parseDuration(s.duration) * 1000);
  const signed = s.modality === 'sign_to_text' || s.modality === 'bidirectional';
  const inputMode = s.modality === 'speech_to_sign' ? 'speech' : s.modality === 'text_to_sign' ? 'text' : 'sign';
  return {
    title: s.title,
    modality: s.modality as Modality,
    startedAt: started.toISOString(),
    endedAt: ended.toISOString(),
    records: [
      {
        speaker: signed ? 'self' : 'other',
        speakerName: signed ? 'You' : 'Speaker',
        inputMode,
        outputEn: s.outputTextEnglish,
        outputUr: s.outputTextUrdu,
        // Only camera recognition produces a real confidence score.
        signSequence: s.signSequence.map((sign) => ({ sign: sign.toUpperCase(), confidence: s.modality === 'sign_to_text' ? s.averageConfidence : undefined })),
        createdAt: started.toISOString(),
      },
    ],
  };
}

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuth();
  const { prefs } = usePreferences();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const preferences = useMemo<UserPreference>(
    () => ({
      ...defaultUserPreferences,
      userId: user?.id ?? '',
      outputLanguage: prefs.outputLanguage,
      visualFeedback: prefs.visualFeedback,
      audioFeedback: prefs.audioFeedback,
      hapticFeedback: prefs.hapticFeedback,
      fontSize: prefs.fontSize,
    }),
    [user, prefs]
  );

  const speakText = useCallback(
    (text: string, options?: { auto?: boolean }) => {
      // Audio feedback is off by default for Deaf users, who still need "Speak aloud" to talk to
      // a hearing person, so a deliberate tap always speaks.
      if (options?.auto && !prefs.audioFeedback) return;
      setIsSpeaking(true);
      Speech.speak(text, {
        language: isUrduText(text) ? 'ur-PK' : 'en-US',
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    },
    [prefs.audioFeedback]
  );

  const stopSpeaking = useCallback(() => {
    Speech.stop().catch(() => undefined);
    setIsSpeaking(false);
  }, []);

  const addSession = useCallback(
    (s: LegacySession): CommunicationSession => {
      if (accessToken) api.history.create(accessToken, toNewSession(s)).catch(() => undefined);
      return { ...s, id: `preview_${Date.now()}`, timestamp: new Date().toISOString() };
    },
    [accessToken]
  );

  const value = useMemo(
    () => ({ preferences, vocabulary: mockVocabulary, addSession, isSpeaking, speakText, stopSpeaking }),
    [preferences, addSession, isSpeaking, speakText, stopSpeaking]
  );

  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export function usePreview(): PreviewValue {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error('usePreview must be used inside PreviewProvider');
  return ctx;
}

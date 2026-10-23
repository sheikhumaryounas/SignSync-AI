import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en, StringKey } from './en';
import { ur } from './ur';
import { ApiError } from '../services/api';

// UI language (labels, buttons, messages). Separate from the output-language preference,
// which decides the language of translated communication.
export type UiLanguage = 'en' | 'ur';

const STORE_KEY = 'signsync.uiLanguage';
const tables: Record<UiLanguage, Record<StringKey, string>> = { en, ur };

interface I18nValue {
  lang: UiLanguage;
  setLang: (lang: UiLanguage) => void;
  t: (key: StringKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<UiLanguage>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY)
      .then((v) => (v === 'ur' || v === 'en' ? setLangState(v) : undefined))
      .catch(() => undefined);
  }, []);

  const setLang = useCallback((next: UiLanguage) => {
    setLangState(next);
    AsyncStorage.setItem(STORE_KEY, next).catch(() => undefined);
  }, []);

  const t = useCallback<I18nValue['t']>(
    (key, params) => {
      let s = tables[lang][key] ?? en[key];
      if (params) for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v));
      return s;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside LanguageProvider');
  return ctx;
}

// Turns an auth/API failure into a message in the current UI language.
export function apiErrorText(e: unknown, t: I18nValue['t']): string {
  if (!(e instanceof ApiError)) return t('error.network');
  switch (e.code) {
    case 'invalid_credentials': {
      const n = e.details?.attemptsLeft ?? 0;
      if (n <= 0) return t('error.invalid_credentials_locked');
      return n === 1 ? t('error.invalid_credentials_one') : t('error.invalid_credentials', { n });
    }
    case 'rate_limited':
      return t('error.rate_limited', { min: Math.max(1, Math.ceil((e.details?.retryAfterSec ?? 900) / 60)) });
    case 'email_taken':
      return t('error.email_taken');
    case 'forbidden':
      return t('error.forbidden');
    case 'validation':
      return e.details?.validation ? t(`error.${e.details.validation}` as StringKey) : e.message;
    default:
      return t('error.network');
  }
}

export type { StringKey };

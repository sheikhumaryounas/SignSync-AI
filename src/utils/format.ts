import { OutputLanguage } from '../types';
import { Modality } from '../services/api';
import { IconName } from '../components/ui';
import { StringKey, UiLanguage } from '../i18n';

type T = (key: StringKey, params?: Record<string, string | number>) => string;

// Dates and times follow the device locale for the chosen UI language (EUC8 special requirement 2).
const locale = (lang: UiLanguage) => (lang === 'ur' ? 'ur-PK' : 'en-PK');

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function dayLabel(iso: string, t: T, lang: UiLanguage): string {
  const diff = Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / 86400000);
  if (diff === 0) return t('history.today');
  if (diff === 1) return t('history.yesterday');
  return new Date(iso).toLocaleDateString(locale(lang), { weekday: 'long', day: 'numeric', month: 'short' });
}

export function timeLabel(iso: string, lang: UiLanguage): string {
  return new Date(iso).toLocaleTimeString(locale(lang), { hour: 'numeric', minute: '2-digit' });
}

export function whenLabel(iso: string, t: T, lang: UiLanguage): string {
  return `${dayLabel(iso, t, lang)}, ${timeLabel(iso, lang)}`;
}

export function durationLabel(startIso: string, endIso: string): string {
  const sec = Math.max(0, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

export function signCountLabel(n: number, t: T): string {
  return n === 1 ? t('history.oneSign') : t('history.signs', { n });
}

// Which translated lines to show, per the output-language preference.
export function linesFor(pref: OutputLanguage, en: string, ur: string): { en?: string; ur?: string } {
  if (pref === 'english') return { en };
  if (pref === 'urdu') return { ur };
  return { en, ur };
}

export const modalityIcon: Record<Modality, IconName> = {
  sign_to_text: 'hand-left-outline',
  speech_to_sign: 'mic-outline',
  text_to_sign: 'keypad-outline',
  bidirectional: 'chatbubbles-outline',
};

export function greetingKey(now = new Date()): StringKey {
  const h = now.getHours();
  if (h < 12) return 'home.morning';
  if (h < 17) return 'home.afternoon';
  return 'home.evening';
}

export function outputLanguageLabel(pref: OutputLanguage, t: T): string {
  return pref === 'english' ? t('out.english') : pref === 'urdu' ? t('out.urdu') : t('out.bilingual');
}

export function channelsLabel(p: { visualFeedback: boolean; audioFeedback: boolean; hapticFeedback: boolean }, t: T): string {
  return [p.visualFeedback && t('fb.visual'), p.audioFeedback && t('fb.audio'), p.hapticFeedback && t('fb.haptic')]
    .filter(Boolean)
    .join(' · ');
}

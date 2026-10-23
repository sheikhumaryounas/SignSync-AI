import { UserRole } from '../../types';
import { PreferenceProfile, Preferences, PreferenceSettings } from './types';

// Contract for EUC3 / SSD-5. Mock now, HTTP in Phase D2.
export interface PreferencesApi {
  get(accessToken: string): Promise<Preferences>;
  update(accessToken: string, settings: PreferenceSettings): Promise<Preferences>;
  listProfiles(accessToken: string): Promise<PreferenceProfile[]>;
  createProfile(accessToken: string, name: string, settings: PreferenceSettings): Promise<PreferenceProfile>;
  deleteProfile(accessToken: string, id: string): Promise<void>;
}

// EUC3 business rule 1: at least one feedback channel stays on. Mirrors the DB CHECK constraint.
export function hasFeedbackChannel(s: Pick<PreferenceSettings, 'visualFeedback' | 'audioFeedback' | 'hapticFeedback'>) {
  return s.visualFeedback || s.audioFeedback || s.hapticFeedback;
}

// EUC3 alt-flow 3.1: first-use defaults come from the role chosen at registration.
export function defaultSettingsFor(role: UserRole): PreferenceSettings {
  const base: PreferenceSettings = {
    outputLanguage: 'bilingual',
    visualFeedback: true,
    audioFeedback: false,
    hapticFeedback: false,
    fontSize: 'normal',
  };
  switch (role) {
    case 'deaf_mute':
      return { ...base, visualFeedback: true, hapticFeedback: true };
    case 'blind_hearing':
      return { ...base, visualFeedback: false, audioFeedback: true, hapticFeedback: true };
    default:
      return base;
  }
}

export function sameSettings(a: PreferenceSettings, b: PreferenceSettings) {
  return (
    a.outputLanguage === b.outputLanguage &&
    a.visualFeedback === b.visualFeedback &&
    a.audioFeedback === b.audioFeedback &&
    a.hapticFeedback === b.hapticFeedback &&
    a.fontSize === b.fontSize
  );
}

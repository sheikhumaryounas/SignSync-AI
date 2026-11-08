import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, defaultSettingsFor, hasFeedbackChannel, PreferenceProfile, PreferenceSettings } from '../services/api';
import { withRetry } from '../services/api/retry';
import { useAuth } from './AuthContext';
import { TextScaleContext } from '../theme/textScale';

// 'local' = applied and cached on this phone, but the server has not confirmed it yet.
export type SyncState = 'loading' | 'synced' | 'saving' | 'local';

interface PreferencesValue {
  prefs: PreferenceSettings;
  syncState: SyncState;
  profiles: PreferenceProfile[];
  /** Applies immediately, then saves. Resolves false if only the local copy was kept. */
  save: (next: PreferenceSettings) => Promise<boolean>;
  createProfile: (name: string) => Promise<PreferenceProfile>;
  deleteProfile: (id: string) => Promise<void>;
  applyProfile: (profile: PreferenceProfile) => Promise<boolean>;
  /** Fetches settings and profiles from the server again (pull-to-refresh). */
  reload: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesValue | undefined>(undefined);
const cacheKey = (uid: string) => `signsync.prefs.cache.${uid}`;
const fallback = defaultSettingsFor('normal');
const textScale: Record<PreferenceSettings['fontSize'], number> = { small: 0.9, normal: 1, large: 1.15 };

const pick = (p: PreferenceSettings): PreferenceSettings => ({
  outputLanguage: p.outputLanguage,
  visualFeedback: p.visualFeedback,
  audioFeedback: p.audioFeedback,
  hapticFeedback: p.hapticFeedback,
  fontSize: p.fontSize,
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuth();
  const [prefs, setPrefs] = useState<PreferenceSettings>(fallback);
  const [syncState, setSyncState] = useState<SyncState>('loading');
  const [profiles, setProfiles] = useState<PreferenceProfile[]>([]);

  // On sign-in: show the cached copy at once, then refresh from the server (TC-AUTH-06, TC-ACC-04).
  useEffect(() => {
    if (!user || !accessToken) {
      setPrefs(fallback);
      setProfiles([]);
      setSyncState('loading');
      return;
    }
    let cancelled = false;
    (async () => {
      const cached = await AsyncStorage.getItem(cacheKey(user.id)).catch(() => null);
      if (cached && !cancelled) setPrefs(JSON.parse(cached));
      try {
        const [server, list] = await Promise.all([
          withRetry(() => api.preferences.get(accessToken)),
          withRetry(() => api.preferences.listProfiles(accessToken)),
        ]);
        if (cancelled) return;
        setPrefs(pick(server));
        setProfiles(list);
        setSyncState('synced');
        AsyncStorage.setItem(cacheKey(user.id), JSON.stringify(pick(server))).catch(() => undefined);
      } catch {
        if (!cancelled) setSyncState(cached ? 'local' : 'synced');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, accessToken]);

  const save = useCallback(
    async (next: PreferenceSettings) => {
      if (!user || !accessToken) return false;
      if (!hasFeedbackChannel(next)) throw new Error('no_feedback_channel');
      // EUC3 business rule 2: changes apply to the current session right away.
      setPrefs(next);
      setSyncState('saving');
      AsyncStorage.setItem(cacheKey(user.id), JSON.stringify(next)).catch(() => undefined);
      try {
        await withRetry(() => api.preferences.update(accessToken, next));
        setSyncState('synced');
        return true;
      } catch {
        setSyncState('local');
        return false;
      }
    },
    [user, accessToken]
  );

  const createProfile = useCallback(
    async (name: string) => {
      if (!accessToken) throw new Error('signed out');
      const created = await api.preferences.createProfile(accessToken, name, prefs);
      setProfiles((list) => [...list, created]);
      return created;
    },
    [accessToken, prefs]
  );

  const deleteProfile = useCallback(
    async (id: string) => {
      if (!accessToken) return;
      await api.preferences.deleteProfile(accessToken, id);
      setProfiles((list) => list.filter((p) => p.id !== id));
    },
    [accessToken]
  );

  const reload = useCallback(async () => {
    if (!user || !accessToken) return;
    const [server, list] = await Promise.all([api.preferences.get(accessToken), api.preferences.listProfiles(accessToken)]);
    setPrefs(pick(server));
    setProfiles(list);
    setSyncState('synced');
    AsyncStorage.setItem(cacheKey(user.id), JSON.stringify(pick(server))).catch(() => undefined);
  }, [user, accessToken]);

  const applyProfile = useCallback((profile: PreferenceProfile) => save(pick(profile.settings)), [save]);

  const value = useMemo(
    () => ({ prefs, syncState, profiles, save, createProfile, deleteProfile, applyProfile, reload }),
    [prefs, syncState, profiles, save, createProfile, deleteProfile, applyProfile, reload]
  );

  return (
    <PreferencesContext.Provider value={value}>
      <TextScaleContext.Provider value={textScale[prefs.fontSize] ?? 1}>{children}</TextScaleContext.Provider>
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside PreferencesProvider');
  return ctx;
}

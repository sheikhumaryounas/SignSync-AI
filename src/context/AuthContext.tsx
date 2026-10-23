import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { User } from '../types';
import { api, AuthSession, RegisterInput } from '../services/api';
import { clearSession, isExpired, readSession, writeSession } from '../services/session';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const tokenRef = useRef<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const signOutLocally = useCallback(async () => {
    tokenRef.current = null;
    setAccessToken(null);
    setUser(null);
    setStatus('signedOut');
    await clearSession();
  }, []);

  const start = useCallback(async (session: AuthSession) => {
    tokenRef.current = session.accessToken;
    setAccessToken(session.accessToken);
    await writeSession({ accessToken: session.accessToken, refreshToken: session.refreshToken, lastActiveAt: Date.now() });
    setUser(session.user);
    setStatus('signedIn');
  }, []);

  // Restore the session on launch (TC-AUTH-06), unless it went 24 h without activity.
  useEffect(() => {
    (async () => {
      const stored = await readSession();
      if (!stored || isExpired(stored)) {
        await signOutLocally();
        return;
      }
      try {
        const me = await api.auth.me(stored.accessToken);
        tokenRef.current = stored.accessToken;
        setAccessToken(stored.accessToken);
        await writeSession({ ...stored, lastActiveAt: Date.now() });
        setUser(me);
        setStatus('signedIn');
      } catch {
        await signOutLocally();
      }
    })();
  }, [signOutLocally]);

  // Coming back to the app counts as activity; past the limit it signs out.
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      if (state !== 'active' || !tokenRef.current) return;
      const stored = await readSession();
      if (!stored || isExpired(stored)) await signOutLocally();
      else await writeSession({ ...stored, lastActiveAt: Date.now() });
    });
    return () => sub.remove();
  }, [signOutLocally]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      accessToken,
      login: async (email, password) => start(await api.auth.login(email, password)),
      register: async (input) => start(await api.auth.register(input)),
      logout: async () => {
        const token = tokenRef.current;
        if (token) await api.auth.logout(token).catch(() => undefined);
        await signOutLocally();
      },
    }),
    [status, user, accessToken, start, signOutLocally]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

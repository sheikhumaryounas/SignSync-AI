import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth tokens live in SecureStore (Android Keystore). SecureStore has no web implementation,
// so the web preview build falls back to AsyncStorage (browser localStorage).
const KEY = 'signsync.session';
const store =
  Platform.OS === 'web'
    ? { get: AsyncStorage.getItem, set: AsyncStorage.setItem, remove: AsyncStorage.removeItem }
    : { get: SecureStore.getItemAsync, set: SecureStore.setItemAsync, remove: SecureStore.deleteItemAsync };

// SRS EUC5 business rule: tokens expire after 24 hours of inactivity.
export const INACTIVITY_LIMIT_MS = 24 * 60 * 60 * 1000;

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  lastActiveAt: number;
}

export async function readSession(): Promise<StoredSession | null> {
  try {
    const raw = await store.get(KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export async function writeSession(session: StoredSession): Promise<void> {
  await store.set(KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await store.remove(KEY);
}

export function isExpired(session: StoredSession, now = Date.now()): boolean {
  return now - session.lastActiveAt > INACTIVITY_LIMIT_MS;
}

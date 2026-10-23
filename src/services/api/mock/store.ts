// Shared helpers for mock adapters: per-user JSON stored in AsyncStorage, plus the
// token → user lookup the backend will do from the JWT.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole } from '../../../types';
import { ApiError } from '../types';

export const ACCOUNTS_KEY = 'signsync.mock.accounts.v1';

export const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

export function userIdFromToken(accessToken: string): string {
  const [kind, userId] = accessToken.split('.');
  if (kind !== 'mock' || !userId) throw new ApiError('unauthorized', 'Your session has ended. Sign in again.');
  return userId;
}

export async function readJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function roleOfUser(userId: string): Promise<UserRole> {
  const accounts = (await readJson<Record<string, { user: { id: string; role: UserRole } }>>(ACCOUNTS_KEY)) ?? {};
  const found = Object.values(accounts).find((a) => a.user.id === userId);
  if (!found) throw new ApiError('unauthorized', 'Your session has ended. Sign in again.');
  return found.user.role;
}

export const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

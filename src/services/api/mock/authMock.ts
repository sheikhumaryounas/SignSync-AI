// Mock auth adapter. Mirrors the backend rules (validation, duplicate email, 5 tries per
// 15 minutes) so screens can be built before Phase D1. Accounts persist in AsyncStorage.
// Development only: passwords are stored as plain text here, never in the real backend.
import { User, UserRole } from '../../../types';
import {
  AuthApi,
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_MS,
  validateEmail,
  validateName,
  validatePassword,
  validationMessages,
} from '../auth';
import { ApiError, AuthSession } from '../types';
import { ACCOUNTS_KEY, readJson, userIdFromToken, writeJson } from './store';
import { seedPreferences } from './preferencesMock';

interface MockAccount {
  user: User;
  password: string;
}

export const DEMO_PASSWORD = 'password123';

export const DEMO_ACCOUNTS: Record<UserRole, { email: string; name: string }> = {
  deaf_mute: { email: 'burhan.raza@signsync.ai', name: 'Burhan Raza' },
  blind_hearing: { email: 'dr.ali.khan@gmail.com', name: 'Dr. Ali Khan' },
  normal: { email: 'saad.dev@signsync.ai', name: 'Muhammad Saad' },
  admin: { email: 'admin@signsync.ai', name: 'Mr. M Shahbaz Ayyaz' },
};

const failedAttempts = new Map<string, number[]>();
const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms));
const norm = (email: string) => email.trim().toLowerCase();

function seed(): Record<string, MockAccount> {
  const accounts: Record<string, MockAccount> = {};
  (Object.keys(DEMO_ACCOUNTS) as UserRole[]).forEach((role) => {
    const { email, name } = DEMO_ACCOUNTS[role];
    accounts[email] = {
      password: DEMO_PASSWORD,
      user: { id: `usr_${role}_demo`, name, email, role, createdAt: '2026-10-01' },
    };
  });
  return accounts;
}

async function load(): Promise<Record<string, MockAccount>> {
  const stored = await readJson<Record<string, MockAccount>>(ACCOUNTS_KEY);
  if (stored) return stored;
  const seeded = seed();
  await writeJson(ACCOUNTS_KEY, seeded);
  return seeded;
}

async function save(accounts: Record<string, MockAccount>) {
  await writeJson(ACCOUNTS_KEY, accounts);
}

function issue(user: User): AuthSession {
  const stamp = Date.now().toString(36);
  return { accessToken: `mock.${user.id}.${stamp}`, refreshToken: `mockr.${user.id}.${stamp}`, user };
}

function recentFailures(email: string): number[] {
  const cutoff = Date.now() - LOGIN_WINDOW_MS;
  const list = (failedAttempts.get(email) ?? []).filter((t) => t > cutoff);
  failedAttempts.set(email, list);
  return list;
}

export const mockAuth: AuthApi = {
  async register(input) {
    await delay();
    const email = norm(input.email);
    const checks: [string, ReturnType<typeof validateEmail>][] = [
      ['name', validateName(input.name)],
      ['email', validateEmail(email)],
      ['password', validatePassword(input.password)],
    ];
    for (const [field, code] of checks) {
      if (code) throw new ApiError('validation', validationMessages[code], { field, validation: code });
    }

    const accounts = await load();
    if (accounts[email]) {
      throw new ApiError('email_taken', 'An account with this email already exists. Sign in instead.', { field: 'email' });
    }
    const user: User = {
      id: `usr_${Date.now().toString(36)}`,
      name: input.name.trim(),
      email,
      role: input.role,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    accounts[email] = { user, password: input.password };
    await save(accounts);
    await seedPreferences(user.id, input.role, input.outputLanguage);
    return issue(user);
  },

  async login(rawEmail, password) {
    await delay();
    const email = norm(rawEmail);
    const failures = recentFailures(email);
    if (failures.length >= LOGIN_MAX_ATTEMPTS) {
      const retryAfterSec = Math.ceil((failures[0] + LOGIN_WINDOW_MS - Date.now()) / 1000);
      throw new ApiError('rate_limited', `Too many attempts. Try again in ${Math.ceil(retryAfterSec / 60)} minutes.`, {
        retryAfterSec,
        attemptsLeft: 0,
      });
    }

    const account = (await load())[email];
    if (!account || account.password !== password) {
      failures.push(Date.now());
      const attemptsLeft = LOGIN_MAX_ATTEMPTS - failures.length;
      throw new ApiError(
        'invalid_credentials',
        attemptsLeft > 0
          ? `Email or password is incorrect. ${attemptsLeft} ${attemptsLeft === 1 ? 'try' : 'tries'} left before a 15-minute pause.`
          : 'Email or password is incorrect. Sign-in is paused for 15 minutes.',
        { attemptsLeft }
      );
    }
    failedAttempts.delete(email);
    return issue(account.user);
  },

  async me(accessToken) {
    await delay(150);
    const userId = userIdFromToken(accessToken);
    const account = Object.values(await load()).find((a) => a.user.id === userId);
    if (!account) throw new ApiError('unauthorized', 'Your session has ended. Sign in again.');
    return account.user;
  },

  async logout() {
    await delay(100);
  },
};

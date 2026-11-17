import { User } from '../../types';
import { AuthSession, ProfileUpdate, RegisterInput } from './types';

// Contract for EUC5 (SSD-1). Implemented by the mock adapter now and the HTTP adapter in Phase D1.
export interface AuthApi {
  register(input: RegisterInput): Promise<AuthSession>;
  login(email: string, password: string): Promise<AuthSession>;
  me(accessToken: string): Promise<User>;
  logout(accessToken: string): Promise<void>;
  /** Updates name, email and photo. avatarUrl: undefined keeps it, null removes it. */
  updateProfile(accessToken: string, input: ProfileUpdate): Promise<User>;
}

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 50;
export const EMAIL_MAX_LENGTH = 254;
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

// local@domain.tld: no spaces, one @, no leading/trailing or doubled dots, a 2+ letter TLD.
const EMAIL_RE = /^[A-Za-z0-9._%+'-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
// Latin or Urdu letters, spaces, and the punctuation real names use (Dr. Ali, O'Neil, Al-Haq).
const NAME_LETTERS = 'A-Za-z\\u00C0-\\u024F\\u0600-\\u06FF';
const NAME_RE = new RegExp(`^[${NAME_LETTERS}][${NAME_LETTERS} .'-]*$`);

// Validators return a code; screens turn it into English or Urdu text.
export type ValidationCode =
  | 'email_required'
  | 'email_invalid'
  | 'email_long'
  | 'password_required'
  | 'password_short'
  | 'password_long'
  | 'password_weak'
  | 'password_spaces'
  | 'name_required'
  | 'name_short'
  | 'name_long'
  | 'name_invalid';

export const validationMessages: Record<ValidationCode, string> = {
  email_required: 'Enter your email address.',
  email_invalid: 'Enter a valid email address, for example name@example.com.',
  email_long: `Email address must be ${EMAIL_MAX_LENGTH} characters or fewer.`,
  password_required: 'Enter your password.',
  password_short: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
  password_long: `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`,
  password_weak: 'Password must include at least one letter and one number.',
  password_spaces: 'Password cannot start or end with a space.',
  name_required: 'Enter your full name.',
  name_short: `Name must be at least ${NAME_MIN_LENGTH} characters.`,
  name_long: `Name must be ${NAME_MAX_LENGTH} characters or fewer.`,
  name_invalid: 'Name can only contain letters, spaces, hyphens, apostrophes and full stops.',
};

export function validateEmail(email: string): ValidationCode | null {
  const v = email.trim();
  if (!v) return 'email_required';
  if (v.length > EMAIL_MAX_LENGTH) return 'email_long';
  const local = v.split('@')[0];
  if (!EMAIL_RE.test(v) || v.includes('..') || local.startsWith('.') || local.endsWith('.')) return 'email_invalid';
  return null;
}

// Full rules, used when an account sets a new password.
export function validatePassword(password: string): ValidationCode | null {
  if (!password) return 'password_required';
  if (password.length < PASSWORD_MIN_LENGTH) return 'password_short';
  if (password.length > PASSWORD_MAX_LENGTH) return 'password_long';
  if (password !== password.trim()) return 'password_spaces';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'password_weak';
  return null;
}

export function validateName(name: string): ValidationCode | null {
  const v = name.trim().replace(/\s+/g, ' ');
  if (!v) return 'name_required';
  if (v.length < NAME_MIN_LENGTH) return 'name_short';
  if (v.length > NAME_MAX_LENGTH) return 'name_long';
  if (!NAME_RE.test(v)) return 'name_invalid';
  return null;
}

// 0–4, used by the strength meter on Register step 1.
export function passwordStrength(password: string): number {
  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score++;
  if (/\d/.test(password)) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score++;
  return score;
}

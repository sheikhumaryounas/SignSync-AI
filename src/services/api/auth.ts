import { User } from '../../types';
import { AuthSession, RegisterInput } from './types';

// Contract for EUC5 (SSD-1). Implemented by the mock adapter now and the HTTP adapter in Phase D1.
export interface AuthApi {
  register(input: RegisterInput): Promise<AuthSession>;
  login(email: string, password: string): Promise<AuthSession>;
  me(accessToken: string): Promise<User>;
  logout(accessToken: string): Promise<void>;
}

export const PASSWORD_MIN_LENGTH = 8;
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Validators return a code; screens turn it into English or Urdu text.
export type ValidationCode = 'email_required' | 'email_invalid' | 'password_short' | 'name_required';

export const validationMessages: Record<ValidationCode, string> = {
  email_required: 'Enter your email address.',
  email_invalid: 'Enter a valid email address, like name@example.com.',
  password_short: `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
  name_required: 'Enter your full name.',
};

export function validateEmail(email: string): ValidationCode | null {
  if (!email.trim()) return 'email_required';
  if (!EMAIL_RE.test(email.trim())) return 'email_invalid';
  return null;
}

export function validatePassword(password: string): ValidationCode | null {
  return password.length < PASSWORD_MIN_LENGTH ? 'password_short' : null;
}

export function validateName(name: string): ValidationCode | null {
  return name.trim() ? null : 'name_required';
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

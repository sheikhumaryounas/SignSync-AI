// Client for the sign-recognition server (server/main.py). The app records a short clip of one sign,
// uploads it and gets the model's top answers back.
import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SignVocabularyItem } from '../../types';
import { aslSign } from './aslSigns';

const PORT = 8000;

// The model's own cut-off (server/pipeline/README.md): answers below 50% are not shown.
export const SIGN_CONFIDENCE_THRESHOLD = 0.5;
const TIMEOUT_MS = 45000;

export type SignErrorCode =
  | 'no_hands'
  | 'no_body'
  | 'bad_video'
  | 'too_large'
  | 'server_down'
  | 'unreachable'
  | 'timeout'
  | 'unknown';

export class SignApiError extends Error {
  constructor(public code: SignErrorCode, message: string) {
    super(message);
    this.name = 'SignApiError';
  }
}

export interface SignGuess {
  sign: SignVocabularyItem;
  confidence: number;
}

export interface SignResult {
  /** Best answer first; at most three. */
  guesses: SignGuess[];
  /** Upload + recognition, as the user waits for it. */
  processingMs: number;
  /**
   * False when the server judged the answer unreliable: probably not one of the 20 signs, or signed
   * unclearly. The model always picks one of its signs, so the app asks the signer to sign again.
   */
  accepted: boolean;
}

const URL_KEY = 'signsync.signApiUrl';
// Address typed in Settings; loaded once at start-up and kept in memory.
let customUrl: string | null = null;
// Every request waits for this, so the first check after start-up already uses the saved address.
const loaded = AsyncStorage.getItem(URL_KEY)
  .then((v) => {
    if (v) customUrl = v;
  })
  .catch(() => undefined);

/** Accepts "192.168.1.20", "192.168.1.20:8000" or a full URL; returns a URL or null if it is not one. */
// Parsed by hand: React Native's URL class does not implement hostname/port.
export function normalizeServerUrl(input: string): string | null {
  const m = /^(?:(https?):\/\/)?([A-Za-z0-9.-]+)(?::(\d{1,5}))?\/*$/i.exec(input.trim());
  if (!m || m[2].startsWith('.') || m[2].endsWith('.')) return null;
  const scheme = (m[1] ?? 'http').toLowerCase();
  const port = m[3] ?? (scheme === 'http' ? String(PORT) : undefined);
  if (port && (Number(port) < 1 || Number(port) > 65535)) return null;
  return `${scheme}://${m[2]}${port ? `:${port}` : ''}`;
}

/** The address saved in Settings, or null when the automatic one is used. */
export const customSignApiUrl = () => customUrl;

export async function setCustomSignApiUrl(url: string | null): Promise<void> {
  customUrl = url;
  if (url) await AsyncStorage.setItem(URL_KEY, url);
  else await AsyncStorage.removeItem(URL_KEY);
}

/**
 * Where the server is reached. An address saved in Settings wins, then EXPO_PUBLIC_SIGN_API_URL.
 * Otherwise requests go to the Expo dev server the app was loaded from, under /sign-api: metro.config.js
 * forwards them to the Python server on the same computer. The phone already reaches that address
 * (it loaded the app from it), so no IP, port or firewall set-up is needed. This also works with --tunnel.
 */
export function signApiUrl(): string | null {
  if (customUrl) return customUrl;
  const fromEnv = process.env.EXPO_PUBLIC_SIGN_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const origin = devServerOrigin();
  return origin ? `${origin}${PROXY_PATH}` : null;
}

const PROXY_PATH = '/sign-api';

const originOf = (uri?: string | null): string | null => /^https?:\/\/[^/?#]+/i.exec(uri ?? '')?.[0] ?? null;

/**
 * Scheme, host and port the app was loaded from. The bundle URL is checked first: it is the address the
 * phone actually used, while the Expo constants are not filled in by every Expo Go version.
 */
function devServerOrigin(): string | null {
  if (Platform.OS === 'web') return typeof window !== 'undefined' ? window.location.origin : null;
  const sourceCode = (TurboModuleRegistry.get('SourceCode') ?? NativeModules.SourceCode) as
    | { getConstants?: () => { scriptURL?: string }; scriptURL?: string }
    | null
    | undefined;
  const scriptURL = sourceCode?.getConstants?.().scriptURL ?? sourceCode?.scriptURL;
  const expoGo = Constants.expoGoConfig as { debuggerHost?: string } | null;
  const hostPort = Constants.expoConfig?.hostUri ?? expoGo?.debuggerHost;
  return originOf(scriptURL) ?? (hostPort ? `http://${hostPort.split('/')[0]}` : null);
}

// What went wrong on the last failed request, shown under the offline notice so a connection problem
// can be diagnosed from the phone (e.g. "TypeError: Network request failed" or "HTTP 404").
let lastFailure: string | null = null;
export const signApiLastFailure = () => lastFailure;

async function request(path: string, init?: RequestInit, timeoutMs = TIMEOUT_MS): Promise<Response> {
  await loaded;
  const base = signApiUrl();
  if (!base) throw new SignApiError('unreachable', 'No sign-recognition server address is set.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}${path}`, { ...init, signal: controller.signal });
    lastFailure = res.ok ? null : `HTTP ${res.status}`;
    return res;
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    lastFailure = aborted ? `No answer within ${timeoutMs / 1000} s` : e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    throw new SignApiError(aborted ? 'timeout' : 'unreachable', aborted ? 'The server took too long.' : 'The server could not be reached.');
  } finally {
    clearTimeout(timer);
  }
}

export type ServerStatus = 'online' | 'server_down' | 'unreachable';

/**
 * Checked before the user records anything. server_down: the computer answered (through the Metro
 * proxy) but the Python server is not running there; unreachable: nothing answered at all.
 */
export async function signServerStatus(): Promise<ServerStatus> {
  try {
    const res = await request('/health', undefined, 8000);
    if (res.ok) return 'online';
    const body = await res.json().catch(() => null);
    return body?.error?.code === 'server_down' ? 'server_down' : 'unreachable';
  } catch (e) {
    if (!lastFailure) lastFailure = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    return 'unreachable';
  }
}

/** Checks an address before it is saved. */
export async function testSignServer(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    return (await fetch(`${url}/health`, { signal: controller.signal })).ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export interface ModelInfo {
  name: string;
  language: string;
  testAccuracy: number;
  testSigners: number;
  trainedOn: string;
  perSign: { label: string; accuracy: number }[];
}

/** Facts about the model the server runs (from its RESULTS.md), for the admin metrics screen. */
export async function fetchModelInfo(): Promise<ModelInfo> {
  const res = await request('/model', undefined, 6000);
  if (!res.ok) throw new SignApiError('unknown', `HTTP ${res.status}`);
  return res.json();
}

/**
 * Posts a form with XMLHttpRequest. Expo SDK 52+ replaces the global fetch with expo/fetch, which
 * throws "Unsupported FormDataPart implementation" for React Native file parts ({ uri, name, type }).
 * React Native's XMLHttpRequest still uploads those natively, streaming the file from disk.
 */
async function postForm(path: string, form: FormData, timeoutMs = TIMEOUT_MS): Promise<{ status: number; body: any }> {
  await loaded;
  const base = signApiUrl();
  if (!base) throw new SignApiError('unreachable', 'No sign-recognition server address is set.');
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${base}${path}`);
    xhr.timeout = timeoutMs;
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onload = () => {
      let body: any = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // Not JSON: handled as an unknown error below.
      }
      lastFailure = xhr.status >= 200 && xhr.status < 300 ? null : `HTTP ${xhr.status}`;
      resolve({ status: xhr.status, body });
    };
    xhr.onerror = () => {
      lastFailure = 'Upload failed: the connection was lost.';
      reject(new SignApiError('unreachable', 'The server could not be reached.'));
    };
    xhr.ontimeout = () => {
      lastFailure = `No answer within ${timeoutMs / 1000} s`;
      reject(new SignApiError('timeout', 'The server took too long.'));
    };
    xhr.send(form);
  });
}

export async function recognizeSignVideo(uri: string): Promise<SignResult> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    form.append('video', await (await fetch(uri)).blob(), 'sign.webm');
  } else {
    const type = uri.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4';
    // React Native's FormData takes a file as { uri, name, type }.
    form.append('video', { uri, name: `sign.${type === 'video/quicktime' ? 'mov' : 'mp4'}`, type } as unknown as Blob);
  }

  const started = Date.now();
  const { status, body } = await postForm('/recognize', form);
  if (status < 200 || status >= 300) {
    const code = body?.error?.code as SignErrorCode | undefined;
    const known: SignErrorCode[] = ['no_hands', 'no_body', 'bad_video', 'too_large', 'server_down'];
    throw new SignApiError(code && known.includes(code) ? code : 'unknown', body?.error?.message ?? `HTTP ${status}`);
  }

  const guesses: SignGuess[] = (body?.predictions ?? [])
    .map((p: { label: string; confidence: number }) => {
      const sign = aslSign(p.label);
      return sign ? { sign, confidence: p.confidence } : null;
    })
    .filter(Boolean);
  if (guesses.length === 0) throw new SignApiError('unknown', 'The server returned no answer.');
  // Older servers send no verdict: fall back to the model's own 50% cut-off.
  const accepted = typeof body?.accepted === 'boolean' ? body.accepted : guesses[0].confidence >= SIGN_CONFIDENCE_THRESHOLD;
  return { guesses, processingMs: Date.now() - started, accepted };
}

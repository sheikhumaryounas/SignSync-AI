import { OutputLanguage, User, UserRole } from '../../types';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export type SelfRegisterRole = Exclude<UserRole, 'admin'>;

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: SelfRegisterRole;
  outputLanguage: OutputLanguage;
}

// ---------- Preferences (EUC3, table user_preferences) ----------

export interface Preferences {
  outputLanguage: OutputLanguage;
  visualFeedback: boolean;
  audioFeedback: boolean;
  hapticFeedback: boolean;
  fontSize: 'normal' | 'large';
  updatedAt: string;
}

export type PreferenceSettings = Omit<Preferences, 'updatedAt'>;

export interface PreferenceProfile {
  id: string;
  name: string;
  settings: PreferenceSettings;
  createdAt: string;
}

// ---------- History (EUC8, tables communication_sessions + translation_records) ----------

export type Modality = 'sign_to_text' | 'speech_to_sign' | 'text_to_sign' | 'bidirectional';

export interface SignToken {
  sign: string;
  // Present for recognised signs; absent for signs mapped from speech or text.
  confidence?: number;
}

export interface TranslationRecord {
  id: string;
  speaker: 'self' | 'other';
  speakerName: string;
  inputMode: 'sign' | 'speech' | 'text';
  outputEn: string;
  outputUr: string;
  signSequence: SignToken[];
  createdAt: string;
}

export interface SessionSummary {
  id: string;
  title: string;
  modality: Modality;
  startedAt: string;
  endedAt: string;
  avgConfidence: number | null;
  signCount: number;
  previewEn: string;
  previewUr: string;
}

export interface SessionDetail extends SessionSummary {
  records: TranslationRecord[];
}

export interface NewSession {
  title: string;
  modality: Modality;
  startedAt: string;
  endedAt: string;
  records: Omit<TranslationRecord, 'id'>[];
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface HistoryQuery {
  cursor?: string | null;
  modality?: Modality;
  q?: string;
  limit?: number;
}

// ---------- Vocabulary & dataset (EUC9, tables gesture_vocabulary + dataset_samples) ----------

export type VocabCategory = 'greetings' | 'daily' | 'medical' | 'emergency' | 'questions' | 'feelings' | 'numbers';
export type VocabStatus = 'active' | 'training' | 'retired';
export type GestureType = 'single_hand' | 'two_hand' | 'body';

export interface VocabEntry {
  id: string;
  nameEn: string;
  nameUr: string;
  category: VocabCategory;
  gestureType: GestureType;
  status: VocabStatus;
  clipCount: number;
  updatedAt: string;
}

export interface VocabInput {
  nameEn: string;
  nameUr: string;
  category: VocabCategory;
  gestureType: GestureType;
}

export interface NewSample {
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  source: 'project' | 'public_dataset';
  consentRecorded: boolean;
}

export interface DatasetSample extends NewSample {
  id: string;
  vocabId: string;
  uploadedAt: string;
}

// ---------- Monitoring (EUC4, tables ai_model_versions + evaluation_runs + performance_logs) ----------

export interface ModelVersion {
  id: string;
  version: string;
  status: 'production' | 'staging' | 'deprecated';
  releasedAt: string;
}

export interface LatencyBreakdown {
  edgeMs: number;
  networkMs: number;
  inferenceMs: number;
  correctionMs: number;
  totalMs: number;
}

export interface MetricsSummary {
  version: ModelVersion;
  days: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  perClass: { sign: string; accuracy: number }[];
  latency: LatencyBreakdown;
  sessions: number;
  computedAt: string;
  /** Set when the dashboard shows the last cached result because the service did not answer. */
  stale?: boolean;
  /** Mock and seeded figures are flagged so the UI never presents them as real results. */
  example?: boolean;
}

export interface FlaggedLog {
  id: string;
  sessionRef: string;
  predictedSign: string;
  confirmedSign?: string;
  confidence: number;
  createdAt: string;
  resolved: boolean;
}

// Error codes shared by the mock adapter and the FastAPI backend ({"error": {"code", "message"}}).
export type ApiErrorCode =
  | 'validation'
  | 'invalid_credentials'
  | 'rate_limited'
  | 'email_taken'
  | 'unauthorized'
  | 'not_found'
  | 'forbidden'
  | 'duplicate'
  | 'network'
  | 'unknown';

export class ApiError extends Error {
  code: ApiErrorCode;
  details?: { attemptsLeft?: number; retryAfterSec?: number; field?: string; validation?: string };

  constructor(code: ApiErrorCode, message: string, details?: ApiError['details']) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

import {
  DatasetSample,
  FlaggedLog,
  MetricsSummary,
  ModelVersion,
  NewSample,
  VocabEntry,
  VocabInput,
  VocabStatus,
} from './types';

// Contracts for EUC9 (vocabulary & dataset) and EUC4 (monitoring). Admin role only:
// every call rejects with code 'forbidden' for other users (TC-ADM-05). Mock now, HTTP in D4/D5.
export interface VocabularyApi {
  list(accessToken: string): Promise<VocabEntry[]>;
  create(accessToken: string, input: VocabInput): Promise<VocabEntry>;
  update(accessToken: string, id: string, input: VocabInput): Promise<VocabEntry>;
  setStatus(accessToken: string, id: string, status: VocabStatus): Promise<VocabEntry>;
  listSamples(accessToken: string, id: string): Promise<DatasetSample[]>;
  addSample(accessToken: string, id: string, sample: NewSample): Promise<DatasetSample>;
}

export interface MetricsApi {
  versions(accessToken: string): Promise<ModelVersion[]>;
  summary(accessToken: string, versionId: string, days: number): Promise<MetricsSummary>;
  flagged(accessToken: string): Promise<FlaggedLog[]>;
  resolveFlag(accessToken: string, id: string): Promise<void>;
}

// EUC9 special requirement 1: reference clips are MP4, at most 50 MB each.
export const SAMPLE_MAX_BYTES = 50 * 1024 * 1024;
export const SAMPLE_MIME = 'video/mp4';

// SRS 3.3.1: capture to displayed text within 3 seconds.
export const LATENCY_BUDGET_MS = 3000;

export function normalizeSignName(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function findDuplicate(list: VocabEntry[], nameEn: string, exceptId?: string) {
  const n = normalizeSignName(nameEn);
  return list.find((v) => v.id !== exceptId && normalizeSignName(v.nameEn) === n);
}

// Mock admin adapters for EUC9 (vocabulary & dataset) and EUC4 (monitoring).
// Metrics here are example figures, flagged `example: true`, until ml/evaluate.py posts real runs (D5).
import { findDuplicate, MetricsApi, SAMPLE_MAX_BYTES, SAMPLE_MIME, VocabularyApi } from '../admin';
import {
  ApiError,
  DatasetSample,
  FlaggedLog,
  GestureType,
  MetricsSummary,
  ModelVersion,
  VocabCategory,
  VocabEntry,
  VocabInput,
  VocabStatus,
} from '../types';
import { delay, newId, readJson, roleOfUser, userIdFromToken, writeJson } from './store';

const VOCAB_KEY = 'signsync.mock.vocabulary.v1';
const SAMPLES_KEY = 'signsync.mock.samples.v1';
const FLAGS_KEY = 'signsync.mock.flagged.v1';
const AUDIT_KEY = 'signsync.mock.audit.v1';

async function requireAdmin(token: string): Promise<string> {
  const uid = userIdFromToken(token);
  if ((await roleOfUser(uid)) !== 'admin') {
    await audit(uid, 'access_denied', 'admin', '');
    throw new ApiError('forbidden', 'Only administrators can open this.');
  }
  return uid;
}

// EUC9 business rule 3: every change records who made it and when.
async function audit(actorId: string, action: string, entity: string, entityId: string, details?: object) {
  const log = (await readJson<object[]>(AUDIT_KEY)) ?? [];
  log.unshift({ id: newId('aud'), actorId, action, entity, entityId, details, at: new Date().toISOString() });
  await writeJson(AUDIT_KEY, log.slice(0, 500));
}

// ---------- Vocabulary ----------

const seedSigns: [string, string, VocabCategory, GestureType, VocabStatus, number][] = [
  ['Hello', 'سلام', 'greetings', 'single_hand', 'active', 142],
  ['Thank you', 'شکریہ', 'greetings', 'single_hand', 'active', 131],
  ['Please', 'براہ کرم', 'greetings', 'two_hand', 'active', 96],
  ['Sorry', 'معاف کیجیے', 'greetings', 'single_hand', 'active', 74],
  ['Goodbye', 'خدا حافظ', 'greetings', 'single_hand', 'retired', 40],
  ['Water', 'پانی', 'daily', 'single_hand', 'active', 96],
  ['Food', 'کھانا', 'daily', 'single_hand', 'active', 88],
  ['Home', 'گھر', 'daily', 'two_hand', 'active', 81],
  ['Bus', 'بس', 'daily', 'two_hand', 'active', 62],
  ['Yes', 'ہاں', 'daily', 'single_hand', 'active', 150],
  ['No', 'نہیں', 'daily', 'single_hand', 'active', 147],
  ['OK', 'ٹھیک ہے', 'daily', 'single_hand', 'active', 120],
  ['Write', 'لکھیں', 'daily', 'single_hand', 'active', 58],
  ['Number', 'نمبر', 'daily', 'single_hand', 'active', 55],
  ['Doctor', 'ڈاکٹر', 'medical', 'two_hand', 'training', 38],
  ['Medicine', 'دوا', 'medical', 'single_hand', 'active', 90],
  ['Fever', 'بخار', 'medical', 'single_hand', 'active', 84],
  ['Headache', 'سر درد', 'medical', 'body', 'active', 70],
  ['Hospital', 'ہسپتال', 'medical', 'two_hand', 'training', 31],
  ['Help', 'مدد', 'emergency', 'two_hand', 'active', 120],
  ['Pain', 'درد', 'emergency', 'body', 'active', 77],
  ['Police', 'پولیس', 'emergency', 'two_hand', 'training', 26],
  ['Where', 'کہاں', 'questions', 'single_hand', 'active', 99],
  ['How', 'کیسے', 'questions', 'two_hand', 'active', 86],
  ['What', 'کیا', 'questions', 'two_hand', 'active', 91],
  ['Understand', 'سمجھنا', 'feelings', 'single_hand', 'active', 64],
  ['Happy', 'خوش', 'feelings', 'body', 'active', 60],
  ['One', 'ایک', 'numbers', 'single_hand', 'active', 110],
  ['Two', 'دو', 'numbers', 'single_hand', 'active', 104],
  ['Ten', 'دس', 'numbers', 'two_hand', 'active', 72],
];

async function loadVocab(): Promise<VocabEntry[]> {
  const stored = await readJson<VocabEntry[]>(VOCAB_KEY);
  if (stored) return stored;
  const now = new Date().toISOString();
  const seeded = seedSigns.map(([nameEn, nameUr, category, gestureType, status, clipCount]) => ({
    id: newId('voc'),
    nameEn,
    nameUr,
    category,
    gestureType,
    status,
    clipCount,
    updatedAt: now,
  }));
  await writeJson(VOCAB_KEY, seeded);
  return seeded;
}

function validateInput(input: VocabInput) {
  if (!input.nameEn.trim()) throw new ApiError('validation', 'Enter the English name.', { field: 'nameEn', validation: 'sign_name_required' });
  if (!input.nameUr.trim()) throw new ApiError('validation', 'Enter the Urdu name.', { field: 'nameUr', validation: 'sign_urdu_required' });
}

export const mockVocabulary: VocabularyApi = {
  async list(token) {
    await delay(250);
    await requireAdmin(token);
    return (await loadVocab()).sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  },

  async create(token, input) {
    await delay();
    const uid = await requireAdmin(token);
    validateInput(input);
    const list = await loadVocab();
    // EUC9 alt-flow 4.1: duplicates are blocked and the existing sign is named.
    const dup = findDuplicate(list, input.nameEn);
    if (dup) throw new ApiError('duplicate', `"${dup.nameEn}" already exists.`, { field: 'nameEn', validation: dup.id });
    const entry: VocabEntry = { ...input, nameEn: input.nameEn.trim(), nameUr: input.nameUr.trim(), id: newId('voc'), status: 'training', clipCount: 0, updatedAt: new Date().toISOString() };
    await writeJson(VOCAB_KEY, [...list, entry]);
    await audit(uid, 'vocab_create', 'gesture_vocabulary', entry.id, { nameEn: entry.nameEn });
    return entry;
  },

  async update(token, id, input) {
    await delay();
    const uid = await requireAdmin(token);
    validateInput(input);
    const list = await loadVocab();
    const dup = findDuplicate(list, input.nameEn, id);
    if (dup) throw new ApiError('duplicate', `"${dup.nameEn}" already exists.`, { field: 'nameEn', validation: dup.id });
    const current = list.find((v) => v.id === id);
    if (!current) throw new ApiError('not_found', 'This sign no longer exists.');
    const updated = { ...current, ...input, nameEn: input.nameEn.trim(), nameUr: input.nameUr.trim(), updatedAt: new Date().toISOString() };
    await writeJson(VOCAB_KEY, list.map((v) => (v.id === id ? updated : v)));
    await audit(uid, 'vocab_update', 'gesture_vocabulary', id, input);
    return updated;
  },

  async setStatus(token, id, status) {
    await delay();
    const uid = await requireAdmin(token);
    const list = await loadVocab();
    const current = list.find((v) => v.id === id);
    if (!current) throw new ApiError('not_found', 'This sign no longer exists.');
    // Retiring never deletes: the sign and its clips stay for audit and can be restored.
    const updated = { ...current, status, updatedAt: new Date().toISOString() };
    await writeJson(VOCAB_KEY, list.map((v) => (v.id === id ? updated : v)));
    await audit(uid, `vocab_${status}`, 'gesture_vocabulary', id);
    return updated;
  },

  async listSamples(token, id) {
    await delay(200);
    await requireAdmin(token);
    return ((await readJson<DatasetSample[]>(SAMPLES_KEY)) ?? []).filter((s) => s.vocabId === id);
  },

  async addSample(token, id, sample) {
    await delay(500);
    const uid = await requireAdmin(token);
    // EUC9 exception 2 and special requirement 1.
    if (sample.mimeType !== SAMPLE_MIME && !sample.fileName.toLowerCase().endsWith('.mp4')) {
      throw new ApiError('validation', 'Reference clips must be MP4 videos.', { field: 'sample', validation: 'sample_format' });
    }
    if (sample.sizeBytes > SAMPLE_MAX_BYTES) {
      throw new ApiError('validation', 'Each clip can be at most 50 MB.', { field: 'sample', validation: 'sample_size' });
    }
    // SRS 1.5.6: clips from people need recorded consent.
    if (sample.source === 'project' && !sample.consentRecorded) {
      throw new ApiError('validation', 'Record signer consent before adding project clips.', { field: 'consent', validation: 'sample_consent' });
    }
    const saved: DatasetSample = { ...sample, id: newId('smp'), vocabId: id, uploadedAt: new Date().toISOString() };
    await writeJson(SAMPLES_KEY, [...((await readJson<DatasetSample[]>(SAMPLES_KEY)) ?? []), saved]);
    const list = await loadVocab();
    await writeJson(VOCAB_KEY, list.map((v) => (v.id === id ? { ...v, clipCount: v.clipCount + 1, updatedAt: saved.uploadedAt } : v)));
    await audit(uid, 'sample_add', 'dataset_samples', saved.id, { vocabId: id, fileName: sample.fileName });
    return saved;
  },
};

// ---------- Metrics ----------

const versions: ModelVersion[] = [
  { id: 'mv_120', version: 'v1.2.0', status: 'production', releasedAt: '2026-10-10' },
  { id: 'mv_110', version: 'v1.1.0', status: 'deprecated', releasedAt: '2026-09-22' },
  { id: 'mv_100', version: 'v1.0.0', status: 'deprecated', releasedAt: '2026-09-01' },
];

const runs: Record<string, Omit<MetricsSummary, 'version' | 'days' | 'sessions' | 'computedAt'>> = {
  mv_120: {
    accuracy: 0.914, precision: 0.897, recall: 0.902, f1: 0.899,
    perClass: [{ sign: 'Thank you', accuracy: 0.78 }, { sign: 'Doctor', accuracy: 0.81 }, { sign: 'Water', accuracy: 0.84 }, { sign: 'Help', accuracy: 0.93 }, { sign: 'Hello', accuracy: 0.97 }],
    latency: { edgeMs: 120, networkMs: 340, inferenceMs: 85, correctionMs: 610, totalMs: 1155 },
  },
  mv_110: {
    accuracy: 0.883, precision: 0.873, recall: 0.873, f1: 0.873,
    perClass: [{ sign: 'Thank you', accuracy: 0.71 }, { sign: 'Doctor', accuracy: 0.74 }, { sign: 'Water', accuracy: 0.83 }, { sign: 'Help', accuracy: 0.9 }, { sign: 'Hello', accuracy: 0.95 }],
    latency: { edgeMs: 130, networkMs: 350, inferenceMs: 110, correctionMs: 830, totalMs: 1420 },
  },
  mv_100: {
    accuracy: 0.821, precision: 0.804, recall: 0.81, f1: 0.806,
    perClass: [{ sign: 'Thank you', accuracy: 0.62 }, { sign: 'Doctor', accuracy: 0.66 }, { sign: 'Water', accuracy: 0.77 }, { sign: 'Help', accuracy: 0.86 }, { sign: 'Hello', accuracy: 0.92 }],
    latency: { edgeMs: 150, networkMs: 360, inferenceMs: 140, correctionMs: 900, totalMs: 1550 },
  },
};

function seedFlags(): FlaggedLog[] {
  const rows: [string, string | undefined, number, number][] = [
    ['WATER', 'THANK YOU', 0.48, 0.1], ['HELP', 'DOCTOR', 0.52, 1], ['YES', undefined, 0.55, 1.4], ['FOOD', 'WATER', 0.57, 2],
    ['HOW', 'WHAT', 0.58, 3], ['PAIN', 'HEADACHE', 0.6, 3.5], ['TWO', 'TEN', 0.61, 4], ['HOME', undefined, 0.62, 5],
    ['FEVER', 'MEDICINE', 0.63, 6], ['SORRY', 'PLEASE', 0.64, 7], ['ONE', undefined, 0.66, 9], ['BUS', 'WHERE', 0.68, 12],
  ];
  return rows.map(([predictedSign, confirmedSign, confidence, daysAgo]) => ({
    id: newId('flg'),
    sessionRef: Math.random().toString(16).slice(2, 6).toUpperCase(),
    predictedSign,
    confirmedSign,
    confidence,
    createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    resolved: false,
  }));
}

export const mockMetrics: MetricsApi = {
  async versions(token) {
    await delay(150);
    await requireAdmin(token);
    return versions;
  },

  async summary(token, versionId, days) {
    await delay(400);
    const uid = await requireAdmin(token);
    const version = versions.find((v) => v.id === versionId);
    if (!version) throw new ApiError('not_found', 'Unknown model version.');
    // EUC4 post-condition 2: every dashboard view is logged.
    await audit(uid, 'metrics_view', 'ai_model_versions', versionId, { days });
    return { ...runs[versionId], version, days, sessions: Math.round(days * 9.4), computedAt: new Date().toISOString(), example: true };
  },

  async flagged(token) {
    await delay(250);
    await requireAdmin(token);
    const stored = await readJson<FlaggedLog[]>(FLAGS_KEY);
    if (stored) return stored;
    const seeded = seedFlags();
    await writeJson(FLAGS_KEY, seeded);
    return seeded;
  },

  async resolveFlag(token, id) {
    await delay(200);
    const uid = await requireAdmin(token);
    const list = (await readJson<FlaggedLog[]>(FLAGS_KEY)) ?? [];
    await writeJson(FLAGS_KEY, list.map((f) => (f.id === id ? { ...f, resolved: true } : f)));
    await audit(uid, 'flag_resolve', 'performance_logs', id);
  },
};

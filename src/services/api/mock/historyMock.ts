import { HISTORY_PAGE_SIZE, HistoryApi } from '../history';
import { ApiError, NewSession, SessionDetail, SessionSummary, SignToken, TranslationRecord } from '../types';
import { delay, newId, readJson, userIdFromToken, writeJson } from './store';

const key = (uid: string) => `signsync.mock.sessions.${uid}`;

type SeedRecord = Omit<TranslationRecord, 'id' | 'createdAt'> & { atSec: number };
interface Seed {
  title: string;
  modality: SessionDetail['modality'];
  daysAgo: number;
  hour: number;
  minute: number;
  durationSec: number;
  records: SeedRecord[];
}

const tok = (pairs: [string, number?][]): SignToken[] => pairs.map(([sign, confidence]) => ({ sign, confidence }));

// Demo conversations for the seeded demo accounts only. New accounts start empty (TC-HIST-04).
const seeds: Seed[] = [
  {
    title: 'Pharmacy counter', modality: 'sign_to_text', daysAgo: 0, hour: 18, minute: 12, durationSec: 42,
    records: [
      { speaker: 'self', speakerName: 'You', inputMode: 'sign', outputEn: 'I need medicine for fever.', outputUr: 'مجھے بخار کی دوا چاہیے۔', signSequence: tok([['MEDICINE', 0.94], ['FEVER', 0.89], ['NEED', 0.9]]), atSec: 0 },
      { speaker: 'other', speakerName: 'Pharmacist', inputMode: 'text', outputEn: 'Take one tablet after meals.', outputUr: 'کھانے کے بعد ایک گولی لیں۔', signSequence: tok([['ONE'], ['TABLET'], ['AFTER'], ['FOOD']]), atSec: 18 },
      { speaker: 'self', speakerName: 'You', inputMode: 'sign', outputEn: 'Thank you.', outputUr: 'شکریہ۔', signSequence: tok([['THANK YOU', 0.96]]), atSec: 36 },
    ],
  },
  {
    title: 'Classroom Q&A', modality: 'speech_to_sign', daysAgo: 1, hour: 11, minute: 5, durationSec: 75,
    records: [
      { speaker: 'other', speakerName: 'Teacher', inputMode: 'speech', outputEn: 'Please repeat the last slide.', outputUr: 'براہ کرم آخری سلائیڈ دوبارہ دکھائیں۔', signSequence: tok([['PLEASE'], ['REPEAT'], ['SLIDE']]), atSec: 0 },
      { speaker: 'self', speakerName: 'You', inputMode: 'sign', outputEn: 'Yes, I understand.', outputUr: 'جی ہاں، سمجھ آ گئی۔', signSequence: tok([['YES', 0.92], ['UNDERSTAND', 0.88]]), atSec: 40 },
    ],
  },
  {
    title: 'Bank visit', modality: 'text_to_sign', daysAgo: 2, hour: 10, minute: 30, durationSec: 58,
    records: [
      { speaker: 'other', speakerName: 'Bank officer', inputMode: 'text', outputEn: 'Please write your account number.', outputUr: 'براہ کرم اپنا اکاؤنٹ نمبر لکھیں۔', signSequence: tok([['PLEASE'], ['WRITE'], ['NUMBER']]), atSec: 0 },
      { speaker: 'self', speakerName: 'You', inputMode: 'sign', outputEn: 'Okay.', outputUr: 'ٹھیک ہے۔', signSequence: tok([['OK', 0.91]]), atSec: 30 },
    ],
  },
  {
    title: 'Doctor appointment', modality: 'bidirectional', daysAgo: 3, hour: 16, minute: 45, durationSec: 124,
    records: [
      { speaker: 'self', speakerName: 'You', inputMode: 'sign', outputEn: 'I have had a headache for two days.', outputUr: 'مجھے دو دن سے سر میں درد ہے۔', signSequence: tok([['HEADACHE', 0.86], ['TWO', 0.9], ['DAY', 0.87]]), atSec: 0 },
      { speaker: 'other', speakerName: 'Doctor', inputMode: 'speech', outputEn: 'Have you taken any medicine?', outputUr: 'کیا آپ نے کوئی دوا لی ہے؟', signSequence: tok([['YOU'], ['MEDICINE'], ['TAKE']]), atSec: 45 },
      { speaker: 'self', speakerName: 'You', inputMode: 'sign', outputEn: 'No.', outputUr: 'نہیں۔', signSequence: tok([['NO', 0.95]]), atSec: 90 },
    ],
  },
  {
    title: 'Bus stop', modality: 'sign_to_text', daysAgo: 5, hour: 8, minute: 20, durationSec: 30,
    records: [
      { speaker: 'self', speakerName: 'You', inputMode: 'sign', outputEn: 'Where is the bus?', outputUr: 'بس کہاں ہے؟', signSequence: tok([['WHERE', 0.9], ['BUS', 0.88]]), atSec: 0 },
      { speaker: 'other', speakerName: 'Passenger', inputMode: 'text', outputEn: 'It comes in ten minutes.', outputUr: 'دس منٹ میں آئے گی۔', signSequence: tok([['TEN'], ['MINUTE'], ['COME']]), atSec: 15 },
    ],
  },
  {
    title: 'Greeting a neighbour', modality: 'sign_to_text', daysAgo: 6, hour: 19, minute: 2, durationSec: 20,
    records: [
      { speaker: 'self', speakerName: 'You', inputMode: 'sign', outputEn: 'Hello, how are you?', outputUr: 'السلام علیکم، آپ کیسے ہیں؟', signSequence: tok([['HELLO', 0.97], ['HOW', 0.9], ['YOU', 0.93]]), atSec: 0 },
    ],
  },
];

type SessionCore = Omit<SessionDetail, 'avgConfidence' | 'signCount' | 'previewEn' | 'previewUr'>;

function summarize(s: SessionCore): SessionDetail {
  const recognised = s.records.flatMap((r) => (r.speaker === 'self' ? r.signSequence.filter((t) => t.confidence != null) : []));
  const avg = recognised.length ? recognised.reduce((sum, t) => sum + (t.confidence ?? 0), 0) / recognised.length : null;
  const first = s.records[0];
  return {
    ...s,
    avgConfidence: avg,
    signCount: recognised.length,
    previewEn: first?.outputEn ?? '',
    previewUr: first?.outputUr ?? '',
  };
}

function buildSeed(): SessionDetail[] {
  return seeds.map((seed) => {
    const start = new Date();
    start.setDate(start.getDate() - seed.daysAgo);
    start.setHours(seed.hour, seed.minute, 0, 0);
    // Keep "today" in the past even when the demo runs early in the morning.
    if (start.getTime() > Date.now()) start.setTime(Date.now() - (seed.durationSec + 300) * 1000);
    const at = (sec: number) => new Date(start.getTime() + sec * 1000).toISOString();
    return summarize({
      id: newId('ses'),
      title: seed.title,
      modality: seed.modality,
      startedAt: start.toISOString(),
      endedAt: at(seed.durationSec),
      records: seed.records.map(({ atSec, ...r }) => ({ ...r, id: newId('rec'), createdAt: at(atSec) })),
    });
  });
}

async function load(uid: string): Promise<SessionDetail[]> {
  const stored = await readJson<SessionDetail[]>(key(uid));
  if (stored) return stored;
  const initial = uid.endsWith('_demo') ? buildSeed() : [];
  await writeJson(key(uid), initial);
  return initial;
}

const toSummary = ({ records, ...rest }: SessionDetail): SessionSummary => rest;

export const mockHistory: HistoryApi = {
  async list(token, query = {}) {
    await delay(300);
    const uid = userIdFromToken(token);
    const q = query.q?.trim().toLowerCase();
    const rows = (await load(uid))
      .filter((s) => !query.modality || s.modality === query.modality)
      .filter(
        (s) =>
          !q ||
          s.title.toLowerCase().includes(q) ||
          s.records.some((r) => r.outputEn.toLowerCase().includes(q) || r.outputUr.includes(q))
      )
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    const offset = query.cursor ? Number(query.cursor) : 0;
    const limit = query.limit ?? HISTORY_PAGE_SIZE;
    const page = rows.slice(offset, offset + limit);
    return { items: page.map(toSummary), nextCursor: offset + limit < rows.length ? String(offset + limit) : null };
  },

  async get(token, id) {
    await delay(250);
    const found = (await load(userIdFromToken(token))).find((s) => s.id === id);
    if (!found) throw new ApiError('not_found', 'This conversation no longer exists.');
    return found;
  },

  async create(token, input: NewSession) {
    await delay(250);
    const uid = userIdFromToken(token);
    const session = summarize({
      id: newId('ses'),
      title: input.title,
      modality: input.modality,
      startedAt: input.startedAt,
      endedAt: input.endedAt,
      records: input.records.map((r) => ({ ...r, id: newId('rec') })),
    });
    await writeJson(key(uid), [session, ...(await load(uid))]);
    return session;
  },

  async remove(token, id) {
    await delay(250);
    const uid = userIdFromToken(token);
    await writeJson(key(uid), (await load(uid)).filter((s) => s.id !== id));
  },
};

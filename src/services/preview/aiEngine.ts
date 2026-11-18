import { SignVocabularyItem } from '../../types';
import { mockVocabulary } from './mockData';
import { ASL_SIGNS } from '../recognition/aslSigns';

// A vocabulary name can list synonyms ("Doctor / Physician"); the first one is the display name.
export const signNameEn = (sign: SignVocabularyItem): string => sign.signNameEnglish.split('/')[0].trim();
export const signNameUr = (sign: SignVocabularyItem): string => sign.signNameUrdu.split('/')[0].trim();
export const signName = (sign: SignVocabularyItem, lang: 'en' | 'ur'): string => (lang === 'ur' ? signNameUr(sign) : signNameEn(sign));
export const signDescription = (sign: SignVocabularyItem, lang: 'en' | 'ur'): string =>
  lang === 'ur' ? sign.descriptionUrdu : sign.descriptionEnglish;

/**
 * Language Correction API Engine
 * Assembles isolated keyword signs into natural Urdu & English sentences.
 * A sentence pattern fires only when every sign it mentions was actually made.
 */
export const correctSignSequence = (signTokens: string[]): { urdu: string; english: string; rawTokens: string[] } => {
  if (signTokens.length === 0) {
    return { urdu: '', english: '', rawTokens: [] };
  }

  const tokens = new Set(signTokens.map(s => s.toLowerCase().trim()));
  const has = (...names: string[]) => names.every(n => tokens.has(n));
  const only = (name: string) => tokens.size === 1 && tokens.has(name);
  const sentence = (urdu: string, english: string) => ({ urdu, english, rawTokens: signTokens });

  if (has('hello', 'doctor', 'emergency help')) {
    return sentence('السلام علیکم ڈاکٹر صاحب، مجھے فوری طبی امداد کی ضرورت ہے۔', 'Assalam-o-Alaikum Doctor, I need urgent medical assistance.');
  }
  if (has('where', 'hospital')) return sentence('قریبی ہسپتال کا راستہ کہاں ہے؟', 'Where is the nearest hospital?');
  if (has('drinking water', 'please')) return sentence('براہ کرم مجھے پینے کا پانی دیں۔', 'Please give me some drinking water.');
  if (has('food', 'drinking water')) return sentence('مجھے کھانے اور پانی کی ضرورت ہے۔', 'I need food and water.');
  if (has('hello', 'how are you?')) return sentence('السلام علیکم! آپ کا کیا حال ہے؟', 'Assalam-o-Alaikum! How are you?');
  if (has('pain', 'medicine')) return sentence('مجھے تکلیف ہے، کیا مجھے دوا مل سکتی ہے؟', 'I am in pain. Could I please get some medicine?');
  if (only('thank you')) return sentence('آپ کا شکریہ۔', 'Thank you.');
  if (only('drinking water')) return sentence('مجھے پینے کا پانی چاہیے۔', 'I need drinking water.');
  if (only('food')) return sentence('مجھے کھانا چاہیے۔', 'I need food.');
  if (only('pain')) return sentence('مجھے تکلیف ہے۔', 'I am in pain.');
  if (only('medicine')) return sentence('مجھے دوا چاہیے۔', 'I need medicine.');
  // Signs from the camera model (ASL-20).
  if (has('drink', 'water')) return sentence('مجھے پانی پینا ہے۔', 'I want to drink water.');
  if (has('where', 'home')) return sentence('گھر کہاں ہے؟', 'Where is home?');
  if (has('wait', 'please')) return sentence('براہ کرم انتظار کریں۔', 'Please wait.');
  if (only('hungry')) return sentence('مجھے بھوک لگی ہے۔', 'I am hungry.');
  if (only('sick')) return sentence('میں بیمار ہوں۔', 'I am sick.');
  if (only('water')) return sentence('مجھے پانی چاہیے۔', 'I need water.');
  if (only('sleep')) return sentence('مجھے نیند آ رہی ہے۔', 'I am sleepy.');
  if (only('call on phone')) return sentence('مجھے فون کرنا ہے۔', 'I need to make a phone call.');

  // No known pattern: list the signs in the order they were made.
  const urduWords = signTokens.map(token => {
    const found = [...mockVocabulary, ...ASL_SIGNS].find(v => signNameEn(v).toLowerCase() === token.toLowerCase().trim());
    return found ? signNameUr(found) : token;
  });

  return sentence(urduWords.join('، ') + '۔', signTokens.join(', ') + '.');
};

// Extra words that should trigger a sign, beyond its own English and Urdu names.
const SIGN_ALIASES: Record<string, string[]> = {
  psl_001: ['assalamualaikum', 'salam', 'سلام', 'وعلیکم السلام'],
  psl_002: ['thanks', 'شکریہ'],
  psl_003: ['برائے مہربانی'],
  psl_004: ['emergency', 'help', 'مدد', 'ایمرجنسی'],
  psl_005: [],
  psl_006: [],
  psl_007: ['water', 'پانی', 'پینے کا صاف پانی'],
  psl_008: ['meal'],
  psl_009: ['how are you', 'آپ کیسے ہیں', 'کیا حال ہے'],
  psl_010: ['ہاں'],
  psl_011: [],
  psl_012: ['located'],
  psl_013: [],
  psl_014: ['درد'],
  psl_015: [],
  psl_016: [],
  psl_017: [],
  psl_018: [],
};

// Grammar words carry no sign of their own, so they are skipped rather than fingerspelled.
const STOP_WORDS = new Set([
  'i', 'me', 'my', 'you', 'your', 'we', 'am', 'are', 'is', 'was', 'be', 'the', 'a', 'an', 'in', 'on', 'at', 'to',
  'for', 'of', 'and', 'or', 'can', 'could', 'will', 'would', 'it', 'this', 'that', 'there', 'too', 'very', 'some',
  'with', 'want', 'need', 'do', 'does',
  'کا', 'کی', 'کے', 'ہے', 'ہیں', 'ہوں', 'سے', 'کو', 'میں', 'نے', 'پر', 'اور', 'مجھے', 'میری', 'میرا', 'آپ', 'کیا',
  'ہو', 'تھا', 'یہ', 'وہ', 'بھی', 'چاہیے', 'کر', 'سکتے', 'ضرورت', 'دیں',
]);

// Lowercases, removes Urdu vowel marks and splits on punctuation in either script.
const toWords = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, '')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?'"،۔؟]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

// Every phrase that maps to a sign, longest first so "پینے کا پانی" wins over "پانی".
const SIGN_PHRASES: { words: string[]; sign: SignVocabularyItem }[] = mockVocabulary
  .flatMap(sign =>
    [...sign.signNameEnglish.split('/'), ...sign.signNameUrdu.split('/'), ...(SIGN_ALIASES[sign.id] ?? [])].map(phrase => ({
      words: toWords(phrase),
      sign,
    }))
  )
  .sort((a, b) => b.words.length - a.words.length);

/**
 * Maps input text (typed or speech-to-text) to a sign sequence. Matches whole words and
 * phrases only, so "کا" can never trigger "پینے کا پانی" and "a" can never trigger "Family".
 */
export const mapTextToSignSequence = (
  inputText: string
): {
  supportedSigns: SignVocabularyItem[];
  unsupportedWords: string[];
  fingerspelledWords: { word: string; letters: string[] }[];
} => {
  const words = toWords(inputText);
  const supportedSigns: SignVocabularyItem[] = [];
  const unsupportedWords: string[] = [];
  const fingerspelledWords: { word: string; letters: string[] }[] = [];

  let i = 0;
  while (i < words.length) {
    const at = i;
    const match = SIGN_PHRASES.find(p => p.words.length > 0 && p.words.every((w, j) => words[at + j] === w));
    if (match) {
      if (!supportedSigns.some(s => s.id === match.sign.id)) supportedSigns.push(match.sign);
      i += match.words.length;
      continue;
    }
    const word = words[i];
    if (!STOP_WORDS.has(word)) {
      unsupportedWords.push(word);
      fingerspelledWords.push({ word, letters: word.toUpperCase().split('') });
    }
    i += 1;
  }

  return { supportedSigns, unsupportedWords, fingerspelledWords };
};

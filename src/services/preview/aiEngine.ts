import { SignVocabularyItem, SignToken } from '../../types';
import { mockVocabulary } from './mockData';

// A vocabulary name can list synonyms ("Doctor / Physician"); the first one is the display name.
export const signNameEn = (sign: SignVocabularyItem): string => sign.signNameEnglish.split('/')[0].trim();
export const signNameUr = (sign: SignVocabularyItem): string => sign.signNameUrdu.split('/')[0].trim();
export const signName = (sign: SignVocabularyItem, lang: 'en' | 'ur'): string => (lang === 'ur' ? signNameUr(sign) : signNameEn(sign));
export const signDescription = (sign: SignVocabularyItem, lang: 'en' | 'ur'): string =>
  lang === 'ur' ? sign.descriptionUrdu : sign.descriptionEnglish;

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface MediaPipeFrame {
  handLeft: LandmarkPoint[];
  handRight: LandmarkPoint[];
  poseSkeleton: LandmarkPoint[];
  faceMesh: LandmarkPoint[];
  edgeLatencyMs: number;
}

/**
 * Generates simulated MediaPipe landmarks for edge preprocessing visualization
 */
export const generateSimulatedLandmarks = (gestureIndex: number = 0): MediaPipeFrame => {
  const t = Date.now() / 300 + gestureIndex;
  
  // Right hand (21 keypoints standard)
  const handRight: LandmarkPoint[] = [];
  const wristX = 0.55 + Math.sin(t * 0.8) * 0.04;
  const wristY = 0.65 + Math.cos(t * 0.8) * 0.03;
  handRight.push({ x: wristX, y: wristY }); // 0: wrist

  // 5 fingers (4 joints each: 1-4 thumb, 5-8 index, 9-12 middle, 13-16 ring, 17-20 pinky)
  const fingerBases = [
    { dx: -0.06, dy: -0.04 },
    { dx: -0.03, dy: -0.12 },
    { dx: 0.0, dy: -0.14 },
    { dx: 0.03, dy: -0.12 },
    { dx: 0.06, dy: -0.09 },
  ];

  fingerBases.forEach((base, fingerIdx) => {
    let currX = wristX + base.dx;
    let currY = wristY + base.dy;
    handRight.push({ x: currX, y: currY });

    for (let j = 1; j <= 3; j++) {
      const curl = Math.sin(t + fingerIdx) * 0.015;
      currX += (base.dx / 2.5) + curl;
      currY += (base.dy / 2.5);
      handRight.push({ x: currX, y: currY });
    }
  });

  // Left hand (21 keypoints standard)
  const handLeft: LandmarkPoint[] = [];
  const lWristX = 0.35 - Math.sin(t * 0.7) * 0.03;
  const lWristY = 0.68 + Math.cos(t * 0.7) * 0.02;
  handLeft.push({ x: lWristX, y: lWristY });

  fingerBases.forEach((base, fingerIdx) => {
    let currX = lWristX - base.dx;
    let currY = lWristY + base.dy;
    handLeft.push({ x: currX, y: currY });

    for (let j = 1; j <= 3; j++) {
      const curl = Math.cos(t + fingerIdx) * 0.015;
      currX -= (base.dx / 2.5) + curl;
      currY += (base.dy / 2.5);
      handLeft.push({ x: currX, y: currY });
    }
  });

  // Pose skeleton (Key torso & shoulders)
  const poseSkeleton: LandmarkPoint[] = [
    { x: 0.5, y: 0.32 }, // 0: Nose
    { x: 0.42, y: 0.42 }, // 11: Left Shoulder
    { x: 0.58, y: 0.42 }, // 12: Right Shoulder
    { x: 0.36, y: 0.58 }, // 13: Left Elbow
    { x: 0.64, y: 0.58 }, // 14: Right Elbow
    { x: lWristX, y: lWristY }, // 15: Left Wrist
    { x: wristX, y: wristY }, // 16: Right Wrist
  ];

  // Face mesh highlights (Forehead, cheeks, chin, lips, eyes)
  const faceMesh: LandmarkPoint[] = [
    { x: 0.5, y: 0.22 }, // Forehead
    { x: 0.45, y: 0.28 }, // Left eye
    { x: 0.55, y: 0.28 }, // Right eye
    { x: 0.5, y: 0.33 }, // Nose tip
    { x: 0.47, y: 0.38 }, // Left mouth corner
    { x: 0.53, y: 0.38 }, // Right mouth corner
    { x: 0.5, y: 0.40 }, // Lower lip
    { x: 0.5, y: 0.44 }, // Chin
  ];

  return {
    handLeft,
    handRight,
    poseSkeleton,
    faceMesh,
    edgeLatencyMs: Math.floor(14 + Math.random() * 8), // ~18ms edge extraction
  };
};

/**
 * Recognizes a sign from the simulated landmark sequence
 */
export const recognizeSignLandmarks = (
  targetSign?: SignVocabularyItem,
  forceConfidence?: number
): { sign: SignVocabularyItem; confidence: number; inferenceTimeMs: number } => {
  const chosenSign = targetSign || mockVocabulary[Math.floor(Math.random() * mockVocabulary.length)];
  
  // Calculate confidence score (mostly high, occasionally testing low)
  let confidence = forceConfidence !== undefined 
    ? forceConfidence 
    : (chosenSign.confidenceAverage - 0.05 + Math.random() * 0.08);

  // Bound to 0.0 - 0.99
  confidence = Math.max(0.45, Math.min(0.99, parseFloat(confidence.toFixed(2))));

  return {
    sign: chosenSign,
    confidence,
    inferenceTimeMs: Math.floor(22 + Math.random() * 12), // ~28ms backend inference
  };
};

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

  // No known pattern: list the signs in the order they were made.
  const urduWords = signTokens.map(token => {
    const found = mockVocabulary.find(v => signNameEn(v).toLowerCase() === token.toLowerCase().trim());
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

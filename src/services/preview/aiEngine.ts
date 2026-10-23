import { SignVocabularyItem, SignToken } from '../../types';
import { mockVocabulary } from './mockData';

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
 * Assembles isolated keyword signs into natural Urdu & English sentences
 */
export const correctSignSequence = (
  signTokens: string[],
  language: 'urdu' | 'english' | 'bilingual' = 'bilingual'
): { urdu: string; english: string; rawTokens: string[] } => {
  if (signTokens.length === 0) {
    return { urdu: '', english: '', rawTokens: [] };
  }

  const normalized = signTokens.map(s => s.toLowerCase().trim());
  const tokenSet = new Set(normalized);

  // Common sentence pattern reconstruction for PSL
  if (tokenSet.has('hello') && tokenSet.has('doctor') && (tokenSet.has('help') || tokenSet.has('need'))) {
    return {
      urdu: 'السلام علیکم ڈاکٹر صاحب، مجھے فوری طبی امداد کی ضرورت ہے۔',
      english: 'Assalam-o-Alaikum Doctor, I need urgent medical assistance.',
      rawTokens: signTokens,
    };
  }

  if (tokenSet.has('where') && tokenSet.has('hospital')) {
    return {
      urdu: 'قریبی ہسپتال کا راستہ کہاں ہے؟',
      english: 'Where is the nearest hospital located?',
      rawTokens: signTokens,
    };
  }

  if (tokenSet.has('food') || tokenSet.has('hungry') || tokenSet.has('water')) {
    if (tokenSet.has('water') && tokenSet.has('please')) {
      return {
        urdu: 'براہِ کرم مجھے پینے کا صاف پانی عنایت فرمائیں۔',
        english: 'Please provide me with some drinking water.',
        rawTokens: signTokens,
      };
    }
    return {
      urdu: 'مجھے بھوک لگی ہے اور کھانے پانی کی ضرورت ہے۔',
      english: 'I am hungry and need food and water.',
      rawTokens: signTokens,
    };
  }

  if (tokenSet.has('hello') && tokenSet.has('how are you?')) {
    return {
      urdu: 'السلام علیکم! آپ کا کیا حال ہے؟ سب خیریت ہے؟',
      english: 'Assalam-o-Alaikum! How are you doing today?',
      rawTokens: signTokens,
    };
  }

  if (tokenSet.has('thank you')) {
    return {
      urdu: 'آپ کی مدد کا بے حد شکریہ۔',
      english: 'Thank you very much for your kind support.',
      rawTokens: signTokens,
    };
  }

  if (tokenSet.has('pain') || tokenSet.has('medicine')) {
    return {
      urdu: 'مجھے تکلیف ہے، کیا مجھے درد کی دوا مل سکتی ہے؟',
      english: 'I am in pain, could I please get some medicine?',
      rawTokens: signTokens,
    };
  }

  // Generic fallback mapping
  const urduWords: string[] = [];
  const englishWords: string[] = [];

  signTokens.forEach(token => {
    const found = mockVocabulary.find(
      v => v.signNameEnglish.toLowerCase().includes(token.toLowerCase()) || 
           token.toLowerCase().includes(v.signNameEnglish.toLowerCase())
    );
    if (found) {
      urduWords.push(found.signNameUrdu.split('/')[0].trim());
      englishWords.push(found.signNameEnglish.split('/')[0].trim());
    } else {
      urduWords.push(token);
      englishWords.push(token);
    }
  });

  return {
    urdu: urduWords.join(' ') + '۔',
    english: englishWords.join(' ') + '.',
    rawTokens: signTokens,
  };
};

/**
 * Maps input text (typed or speech-to-text) to sign sequence
 */
export const mapTextToSignSequence = (
  inputText: string
): { 
  supportedSigns: SignVocabularyItem[]; 
  unsupportedWords: string[]; 
  fingerspelledWords: { word: string; letters: string[] }[] 
} => {
  const words = inputText
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const supportedSigns: SignVocabularyItem[] = [];
  const unsupportedWords: string[] = [];
  const fingerspelledWords: { word: string; letters: string[] }[] = [];

  words.forEach(word => {
    // Look up in dictionary
    const match = mockVocabulary.find(item => {
      const eng = item.signNameEnglish.toLowerCase();
      const urdu = item.signNameUrdu.toLowerCase();
      return eng.includes(word) || urdu.includes(word) || word.includes(item.id);
    });

    if (match) {
      if (!supportedSigns.find(s => s.id === match.id)) {
        supportedSigns.push(match);
      }
    } else {
      // Common stop words to ignore
      if (!['is', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'کا', 'کی', 'کے', 'ہے', 'ہیں', 'سے'].includes(word)) {
        unsupportedWords.push(word);
        fingerspelledWords.push({
          word,
          letters: word.toUpperCase().split(''),
        });
      }
    }
  });

  return {
    supportedSigns,
    unsupportedWords,
    fingerspelledWords,
  };
};

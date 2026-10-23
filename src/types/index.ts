import type { NavigatorScreenParams } from '@react-navigation/native';

export type UserRole = 'deaf_mute' | 'blind_hearing' | 'normal' | 'admin';

export type OutputLanguage = 'urdu' | 'english' | 'bilingual';
export type ThemeMode = 'light' | 'dark' | 'system';

export type ModalityType = 'sign_to_text' | 'speech_to_sign' | 'text_to_sign' | 'bidirectional';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface UserPreference {
  userId: string;
  themeMode: ThemeMode;
  outputLanguage: OutputLanguage;
  visualFeedback: boolean;
  audioFeedback: boolean;
  hapticFeedback: boolean;
  confidenceThreshold: number; // 0.5 to 0.95 (e.g. 0.75)
  highContrast: boolean;
  fontSize: 'normal' | 'large';
  avatarStyle: 'modern_3d' | 'minimal' | 'neon';
  avatarSpeed: number; // 0.5, 1.0, 1.5
  activeProfileName?: string;
}

export interface SignToken {
  id: string;
  nameEnglish: string;
  nameUrdu: string;
  confidence: number;
  timestamp: string;
  category?: string;
}

export interface CommunicationSession {
  id: string;
  userId: string;
  title: string;
  modality: ModalityType;
  inputText: string;
  outputTextUrdu: string;
  outputTextEnglish: string;
  signSequence: string[];
  averageConfidence: number;
  timestamp: string;
  duration: string;
  feedbackGiven?: 'up' | 'down';
  notes?: string;
}

export interface SignVocabularyItem {
  id: string;
  signNameEnglish: string;
  signNameUrdu: string;
  category: 'greetings' | 'emergency' | 'questions' | 'daily' | 'medical' | 'numbers' | 'feelings';
  sampleCount: number;
  status: 'active' | 'retired' | 'training';
  descriptionEnglish: string;
  descriptionUrdu: string;
  gestureType: 'single_hand' | 'two_hand' | 'body_movement';
  landmarkCount: number;
  confidenceAverage: number;
  iconEmoji?: string;
  description?: string;
}

export type UserTabParamList = {
  Home: undefined;
  CommunicationHistory: { openSessionId?: string } | undefined;
  Preferences: undefined;
  Profile: undefined;
};

export type AdminTabParamList = {
  AdminDashboard: { initialTab?: 'metrics' | 'vocabulary' } | undefined;
  Vocabulary: undefined;
  Preferences: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<UserTabParamList> | undefined;
  AdminMain: NavigatorScreenParams<AdminTabParamList> | undefined;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  SessionDetail: { id: string };
  CompareVersions: { a?: string | null; b?: string | null; days?: number } | undefined;
  SignRecognition: { initialMode?: 'live' | 'practice'; targetSignId?: string } | undefined;
  VoiceSign: undefined;
  TextToSign: undefined;
  BidirectionalChat: undefined;
};

import { AuthApi } from './auth';
import { HistoryApi } from './history';
import { PreferencesApi } from './preferences';
import { MetricsApi, VocabularyApi } from './admin';
import { mockAuth } from './mock/authMock';
import { mockHistory } from './mock/historyMock';
import { mockPreferences } from './mock/preferencesMock';
import { mockMetrics, mockVocabulary } from './mock/adminMock';

// Single entry point for data. Screens call `api.*` and never know which adapter is behind it.
// Phase D swaps each module from its mock adapter to the HTTP adapter one at a time.
export const api: {
  auth: AuthApi;
  preferences: PreferencesApi;
  history: HistoryApi;
  vocabulary: VocabularyApi;
  metrics: MetricsApi;
} = {
  auth: mockAuth,
  preferences: mockPreferences,
  history: mockHistory,
  vocabulary: mockVocabulary,
  metrics: mockMetrics,
};

export * from './types';
export { validateEmail, validatePassword, validateName, passwordStrength, PASSWORD_MIN_LENGTH } from './auth';
export type { ValidationCode } from './auth';
export { hasFeedbackChannel, defaultSettingsFor, sameSettings } from './preferences';
export { HISTORY_PAGE_SIZE } from './history';
export { findDuplicate, LATENCY_BUDGET_MS, SAMPLE_MAX_BYTES, SAMPLE_MIME } from './admin';

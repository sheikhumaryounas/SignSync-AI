import { createContext } from 'react';

// Multiplier for every AppText size; PreferencesProvider sets 1.15 for the "Large" text preference.
export const TextScaleContext = createContext(1);

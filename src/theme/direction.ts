import { createContext, useContext } from 'react';
import { TextStyle, ViewStyle } from 'react-native';

// True while the UI language is Urdu. LanguageProvider sets it. Mirroring through this context
// (rather than I18nManager.forceRTL) applies at once, without restarting the app.
export const DirectionContext = createContext(false);

const ltr = {
  isRTL: false,
  row: { flexDirection: 'row' } as ViewStyle,
  start: 'flex-start' as const,
  end: 'flex-end' as const,
  textStart: 'left' as TextStyle['textAlign'],
  back: 'chevron-back' as const,
  forward: 'chevron-forward' as const,
  arrowForward: 'arrow-forward' as const,
};

const rtl = {
  isRTL: true,
  row: { flexDirection: 'row-reverse' } as ViewStyle,
  start: 'flex-end' as const,
  end: 'flex-start' as const,
  textStart: 'right' as TextStyle['textAlign'],
  back: 'chevron-forward' as const,
  forward: 'chevron-back' as const,
  arrowForward: 'arrow-back' as const,
};

export function useDirection() {
  return useContext(DirectionContext) ? rtl : ltr;
}

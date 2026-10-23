import { TextStyle } from 'react-native';

// Font family names registered by useAppFonts(). With custom fonts each weight
// is its own family, so set fontFamily instead of fontWeight.
export const fonts = {
  light: 'Lexend_300Light',
  regular: 'Lexend_400Regular',
  medium: 'Lexend_500Medium',
  semibold: 'Lexend_600SemiBold',
  bold: 'Lexend_700Bold',
  extrabold: 'Lexend_800ExtraBold',
  urdu: 'NotoNastaliqUrdu_400Regular',
  urduSemibold: 'NotoNastaliqUrdu_600SemiBold',
} as const;

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodySm'
  | 'caption'
  | 'label'
  | 'button'
  | 'urdu'
  | 'urduSm';

export const type: Record<TextVariant, TextStyle> = {
  display: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
  title: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  heading: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  bodySm: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18 },
  caption: { fontFamily: fonts.regular, fontSize: 11.5, lineHeight: 16 },
  label: { fontFamily: fonts.semibold, fontSize: 10.5, lineHeight: 14, letterSpacing: 1, textTransform: 'uppercase' },
  button: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18 },
  // Nastaliq needs roughly twice the line height of Latin text.
  urdu: { fontFamily: fonts.urdu, fontSize: 16, lineHeight: 34, writingDirection: 'rtl', textAlign: 'right' },
  urduSm: { fontFamily: fonts.urdu, fontSize: 13, lineHeight: 27, writingDirection: 'rtl', textAlign: 'right' },
};

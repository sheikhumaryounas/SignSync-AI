// Brand palette sampled from the SignSync AI logo. Light theme only for FYP-1.
export const palette = {
  navy: '#002358', // logo navy: headings, primary buttons, app bars
  navy2: '#0B3A7E', // gradient end on brand bands
  navySoft: '#EAF0F8',
  teal: '#00B3C4', // logo teal: active, focus, toggles. Use navy text on it.
  tealInk: '#007C88', // teal text on white (4.9:1)
  tealSoft: '#E2F6F8',
  tealTint: '#F2FBFC',

  ink: '#0E1E3A',
  ink2: '#4A5B78',
  muted: '#8392AB',
  line: '#E3E9F2',
  line2: '#EEF2F7',
  toggleOff: '#CBD5E3',
  outline: '#B8C4D6',

  canvas: '#F5F8FC',
  surface: '#FFFFFF',

  success: '#0E8A60',
  successSoft: '#E4F6EE',
  warning: '#A86400',
  warningSoft: '#FFF3DA',
  error: '#C8352C',
  errorSoft: '#FDECEA',

  chartBlue: '#7FA3D1',
  chartAmber: '#F2A93B',

  onNavy: '#FFFFFF',
  onNavyMuted: '#B9CBE6',
  tealOnNavy: '#7FE6F0',
  glass: 'rgba(255,255,255,0.12)',
  scrim: 'rgba(0,20,52,0.45)',
  white: '#FFFFFF',
} as const;

export type Palette = typeof palette;

// Legacy token set kept only for the FYP-2 preview screens and AppLogo. Values point at the
// logo palette. New code uses `palette`.
export interface ThemePalette {
  isDark: boolean;
  brandNavy: string;
  brandNavyDark: string;
  brandNavyLight: string;
  brandCyan: string;
  brandCyanLight: string;
  brandCyanSoft: string;
  brandCyanDark: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySoft: string;
  primaryMuted: string;
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  secondarySoft: string;
  accent: string;
  accentCyan: string;
  accentNavy: string;
  accentPurple: string;
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceSecondary: string;
  surfaceElevated: string;
  surfaceDark: string;
  surfaceDarkElevated: string;
  cardBackground: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textLight: string;
  textOnPrimary: string;
  textCyan: string;
  urduText: string;
  success: string;
  successLight: string;
  successDark: string;
  warning: string;
  warningLight: string;
  warningDark: string;
  error: string;
  errorLight: string;
  errorDark: string;
  info: string;
  infoLight: string;
  confidenceHigh: string;
  confidenceMedium: string;
  confidenceLow: string;
  border: string;
  borderLight: string;
  borderDark: string;
  borderCyan: string;
  cardShadow: string;
  cardShadowCyan: string;
  white: string;
  black: string;
  overlay: string;
}

export const lightColors: ThemePalette = {
  isDark: false,
  brandNavy: palette.navy,
  brandNavyDark: '#001A44',
  brandNavyLight: palette.navy2,
  brandCyan: palette.teal,
  brandCyanLight: palette.tealSoft,
  brandCyanSoft: palette.tealTint,
  brandCyanDark: palette.tealInk,

  primary: palette.navy,
  primaryDark: '#001A44',
  primaryLight: palette.navy2,
  primarySoft: palette.navySoft,
  primaryMuted: '#D6E1F0',

  secondary: palette.teal,
  secondaryDark: palette.tealInk,
  secondaryLight: palette.tealSoft,
  secondarySoft: palette.tealTint,

  accent: palette.chartAmber,
  accentCyan: palette.teal,
  accentNavy: palette.navy,
  accentPurple: palette.chartBlue,

  background: palette.canvas,
  backgroundAlt: palette.line2,
  surface: palette.surface,
  surfaceSecondary: palette.canvas,
  surfaceElevated: palette.surface,
  surfaceDark: '#001A44',
  surfaceDarkElevated: palette.navy,
  cardBackground: palette.surface,

  text: palette.ink,
  textSecondary: palette.ink2,
  textMuted: palette.muted,
  textLight: palette.white,
  textOnPrimary: palette.white,
  textCyan: palette.tealInk,
  urduText: palette.navy,

  success: palette.success,
  successLight: palette.successSoft,
  successDark: palette.success,
  warning: palette.warning,
  warningLight: palette.warningSoft,
  warningDark: palette.warning,
  error: palette.error,
  errorLight: palette.errorSoft,
  errorDark: palette.error,
  info: palette.tealInk,
  infoLight: palette.tealSoft,

  confidenceHigh: palette.success,
  confidenceMedium: '#D98A00',
  confidenceLow: palette.error,

  border: palette.line,
  borderLight: palette.line2,
  borderDark: palette.outline,
  borderCyan: palette.teal,
  cardShadow: 'rgba(0, 35, 88, 0.07)',
  cardShadowCyan: 'rgba(0, 179, 196, 0.15)',

  white: palette.white,
  black: '#000000',
  overlay: palette.scrim,
};

export const colors = lightColors;

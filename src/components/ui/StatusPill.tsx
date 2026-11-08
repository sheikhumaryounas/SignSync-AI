import React from 'react';
import { StyleSheet, View } from 'react-native';
import { fonts, palette, radius, useDirection } from '../../theme';
import { AppText } from './AppText';

export type StatusTone = 'success' | 'warning' | 'muted' | 'info' | 'live' | 'error';

const tones = (): Record<StatusTone, { bg: string; fg: string }> => ({
  success: { bg: palette.successSoft, fg: palette.success },
  warning: { bg: palette.warningSoft, fg: palette.warning },
  muted: { bg: palette.line2, fg: palette.muted },
  info: { bg: palette.navySoft, fg: palette.navyText },
  live: { bg: 'rgba(0,179,196,0.2)', fg: palette.tealOnNavy },
  error: { bg: palette.errorSoft, fg: palette.error },
});

export function StatusPill({ label, tone = 'success' }: { label: string; tone?: StatusTone }) {
  const t = tones()[tone];
  const { row, start } = useDirection();
  return (
    <View style={[styles.pill, row, { backgroundColor: t.bg, alignSelf: start }]}>
      <View style={[styles.dot, { backgroundColor: t.fg }]} />
      <AppText style={[styles.text, { color: t.fg }]}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    minHeight: 24,
    borderRadius: radius.pill,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  text: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16 },
});

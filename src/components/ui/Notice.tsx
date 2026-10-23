import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing } from '../../theme';
import { AppText } from './AppText';
import { IconName } from './icons';

export type NoticeTone = 'info' | 'success' | 'warning' | 'error';

const tones: Record<NoticeTone, { bg: string; fg: string; icon: IconName }> = {
  info: { bg: palette.tealTint, fg: palette.tealInk, icon: 'information-circle-outline' },
  success: { bg: palette.successSoft, fg: palette.success, icon: 'checkmark-circle-outline' },
  warning: { bg: palette.warningSoft, fg: palette.warning, icon: 'alert-circle-outline' },
  error: { bg: palette.errorSoft, fg: palette.error, icon: 'close-circle-outline' },
};

export function Notice({ message, tone = 'info' }: { message: string; tone?: NoticeTone }) {
  const t = tones[tone];
  return (
    <View style={[styles.box, { backgroundColor: t.bg }]} accessibilityRole="alert">
      <Ionicons name={t.icon} size={15} color={t.fg} style={styles.icon} />
      <AppText variant="caption" color={t.fg} style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md - 2, borderRadius: radius.sm + 1, alignItems: 'flex-start' },
  icon: { marginTop: 1 },
  text: { flex: 1 },
});

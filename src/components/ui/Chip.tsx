import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { fonts, palette, radius, spacing } from '../../theme';
import { AppText } from './AppText';

export type ChipTone = 'default' | 'teal' | 'dashed' | 'glass' | 'tealSolid';

interface ChipProps {
  label: string;
  selected?: boolean;
  tone?: ChipTone;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityHint?: string;
}

export function Chip({ label, selected = false, tone = 'default', onPress, onLongPress, accessibilityHint }: ChipProps) {
  const look = selected ? styles.selected : styles[tone];
  const color = selected
    ? palette.white
    : tone === 'teal'
      ? palette.tealInk
      : tone === 'glass'
        ? palette.white
        : tone === 'tealSolid'
          ? palette.navy
          : palette.ink2;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityHint={accessibilityHint}
      disabled={!onPress && !onLongPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={onPress ? { selected } : undefined}
      hitSlop={6}
      style={({ pressed }) => [styles.base, look, pressed ? { opacity: 0.8 } : null]}
    >
      <AppText variant="caption" color={color} style={styles.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 30,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontFamily: fonts.medium },
  default: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  teal: { backgroundColor: palette.tealSoft },
  dashed: { borderWidth: 1, borderStyle: 'dashed', borderColor: palette.outline },
  glass: { backgroundColor: palette.glass },
  tealSolid: { backgroundColor: palette.teal },
  selected: { backgroundColor: palette.navy },
});

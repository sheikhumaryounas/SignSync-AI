import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing, useDirection } from '../../theme';
import { AppText } from './AppText';
import { IconName } from './icons';

// danger = soft red for a first destructive tap; destructive = solid red for the final confirm.
export type ButtonVariant = 'primary' | 'teal' | 'ghost' | 'danger' | 'destructive';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** Reserve for controls whose meaning the icon carries (play, pause, speak). Plain actions read better as text. */
  icon?: IconName;
  iconRight?: IconName;
  fullWidth?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
}

const tones = (): Record<ButtonVariant, { bg: string; fg: string; border?: string }> => ({
  primary: { bg: palette.navy, fg: palette.white },
  teal: { bg: palette.teal, fg: palette.onTeal },
  ghost: { bg: palette.surface, fg: palette.navyText, border: palette.line },
  danger: { bg: palette.errorSoft, fg: palette.error },
  destructive: { bg: palette.error, fg: palette.white },
});

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  iconRight,
  fullWidth = true,
  style,
  accessibilityHint,
}: ButtonProps) {
  const { row, arrowForward } = useDirection();
  const tone = tones()[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: tone.border && pressed ? palette.canvas : tone.bg },
        tone.border ? { borderWidth: 1, borderColor: tone.border } : null,
        pressed && !tone.border ? styles.pressed : null,
        disabled && !loading ? styles.disabled : null,
        fullWidth ? styles.full : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone.fg} />
      ) : (
        <View style={[styles.row, row]}>
          {icon ? <Ionicons name={icon} size={17} color={tone.fg} /> : null}
          <AppText variant="button" color={tone.fg}>
            {title}
          </AppText>
          {iconRight ? <Ionicons name={iconRight === 'arrow-forward' ? arrowForward : iconRight} size={17} color={tone.fg} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { alignSelf: 'stretch' },
  row: { alignItems: 'center', gap: spacing.sm },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
});

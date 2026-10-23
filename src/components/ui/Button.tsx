import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing } from '../../theme';
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
  icon?: IconName;
  iconRight?: IconName;
  fullWidth?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
}

const tones: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: palette.navy, fg: palette.white },
  teal: { bg: palette.teal, fg: palette.navy },
  ghost: { bg: palette.surface, fg: palette.navy, border: palette.line },
  danger: { bg: palette.errorSoft, fg: palette.error },
  destructive: { bg: palette.error, fg: palette.white },
};

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
  const inactive = disabled || loading;
  const tone = inactive ? { bg: palette.line2, fg: palette.muted } : tones[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: tone.bg },
        'border' in tone && tone.border ? { borderWidth: 1.5, borderColor: tone.border } : null,
        fullWidth ? styles.full : null,
        pressed && !inactive ? styles.pressed : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={16} color={tone.fg} /> : null}
          <AppText variant="button" color={tone.fg}>
            {title}
          </AppText>
          {iconRight ? <Ionicons name={iconRight} size={16} color={tone.fg} /> : null}
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});

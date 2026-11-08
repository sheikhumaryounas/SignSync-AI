import React from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing, useDirection } from '../../theme';
import { AppText } from './AppText';
import { IconName } from './icons';
import { usePressScale } from './motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const inactive = disabled || loading;
  const tone = inactive ? { bg: palette.line2, fg: palette.muted } : tones()[variant];
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.base,
        { backgroundColor: tone.bg },
        'border' in tone && tone.border ? { borderWidth: 1.5, borderColor: tone.border } : null,
        fullWidth ? styles.full : null,
        style,
        { transform: [{ scale }] },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone.fg} />
      ) : (
        <View style={[styles.row, row]}>
          {icon ? <Ionicons name={icon} size={16} color={tone.fg} /> : null}
          <AppText variant="button" color={tone.fg}>
            {title}
          </AppText>
          {iconRight ? <Ionicons name={iconRight === 'arrow-forward' ? arrowForward : iconRight} size={16} color={tone.fg} /> : null}
        </View>
      )}
    </AnimatedPressable>
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
});

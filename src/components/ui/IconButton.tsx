import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, shadow } from '../../theme';
import { IconName } from './icons';

interface IconButtonProps {
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  tone?: 'default' | 'outline' | 'glass' | 'danger';
}

// 36 px visual, 44 px touch target via hitSlop.
export function IconButton({ icon, onPress, accessibilityLabel, tone = 'default' }: IconButtonProps) {
  const color = tone === 'glass' ? palette.white : tone === 'danger' ? palette.error : palette.navy;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.base, styles[tone], pressed ? { opacity: 0.75 } : null]}
    >
      <Ionicons name={icon} size={18} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  default: { backgroundColor: palette.surface, boxShadow: shadow.card },
  outline: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  glass: { backgroundColor: palette.glass },
  danger: { backgroundColor: palette.surface, boxShadow: shadow.card },
});

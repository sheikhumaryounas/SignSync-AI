import React from 'react';
import { Pressable, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { palette, radius, shadow, spacing } from '../../theme';

interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
  style?: ViewStyle | ViewStyle[];
  accessibilityLabel?: string;
}

export function Card({ onPress, padded = true, style, children, accessibilityLabel, ...rest }: CardProps) {
  const base = [styles.card, padded ? styles.padded : null, style];
  if (!onPress) {
    return (
      <View {...rest} style={base}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed ? { opacity: 0.9 } : null]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, boxShadow: shadow.card },
  padded: { padding: spacing.md },
});

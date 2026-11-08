import React from 'react';
import { Animated, Pressable, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { palette, radius, shadow, spacing, themedStyles } from '../../theme';
import { usePressScale } from './motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
  style?: ViewStyle | ViewStyle[];
  accessibilityLabel?: string;
}

export function Card({ onPress, padded = true, style, children, accessibilityLabel, ...rest }: CardProps) {
  const base = [styles.card, padded ? styles.padded : null, style];
  const { scale, onPressIn, onPressOut } = usePressScale(0.98);
  if (!onPress) {
    return (
      <View {...rest} style={base}>
        {children}
      </View>
    );
  }
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[base, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = themedStyles(() => ({
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, boxShadow: shadow.card },
  padded: { padding: spacing.md },
}));

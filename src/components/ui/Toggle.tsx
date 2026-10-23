import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { palette } from '../../theme';

interface ToggleProps {
  value: boolean;
  onValueChange?: (next: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

const TRACK_W = 40;
const THUMB = 18;
const PAD = 3;

export function Toggle({ value, onValueChange, accessibilityLabel, disabled = false }: ToggleProps) {
  const x = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(x, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: true }).start();
  }, [value, x]);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [0, TRACK_W - THUMB - PAD * 2] });

  return (
    <Pressable
      onPress={() => onValueChange?.(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      hitSlop={10}
      style={[styles.track, { backgroundColor: value ? palette.teal : palette.toggleOff }, disabled ? { opacity: 0.5 } : null]}
    >
      <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: TRACK_W, height: THUMB + PAD * 2, borderRadius: 13, padding: PAD, justifyContent: 'center' },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: palette.white,
    boxShadow: '0px 1px 3px rgba(0, 35, 88, 0.3)',
  },
});

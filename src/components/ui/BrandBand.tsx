import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '../../theme';
import { CircuitLines } from './CircuitLines';

interface BrandBandProps {
  children: React.ReactNode;
  circuitPosition?: 'bottom' | 'top';
  style?: ViewStyle;
}

// Navy header band used on brand screens (Home, admin dashboard). Pads for the status bar itself.
export function BrandBand({ children, circuitPosition = 'bottom', style }: BrandBandProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.band, { paddingTop: insets.top + spacing.sm }, style]}>
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="band" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palette.navy} />
            <Stop offset="1" stopColor={palette.navy2} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#band)" />
      </Svg>
      <View
        pointerEvents="none"
        style={[styles.circuit, circuitPosition === 'top' ? { top: insets.top + 16 } : { bottom: -10 }]}
      >
        <CircuitLines width={circuitPosition === 'top' ? 170 : 200} opacity={0.32} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    backgroundColor: palette.navy,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg + 2,
    overflow: 'hidden',
    gap: spacing.md,
  },
  circuit: { position: 'absolute', right: -26 },
});

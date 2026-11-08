import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, themedStyles } from '../../theme';
import { CircuitLines } from './CircuitLines';
import { Stagger } from './motion';

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
      <View
        pointerEvents="none"
        style={[styles.circuit, circuitPosition === 'top' ? { top: insets.top + 16 } : { bottom: -10 }]}
      >
        <CircuitLines width={circuitPosition === 'top' ? 170 : 200} opacity={0.32} />
      </View>
      <Stagger>{children}</Stagger>
    </View>
  );
}

const styles = themedStyles(() => ({
  band: {
    backgroundColor: palette.navy,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg + 2,
    overflow: 'hidden',
    gap: spacing.md,
  },
  circuit: { position: 'absolute', right: -26 },
}));

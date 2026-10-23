import React from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { palette } from '../../theme';

// The circuit traces from the logo's digital hand, used as a brand motif.
export function CircuitLines({ width = 200, opacity = 0.35, color = palette.teal }: { width?: number; opacity?: number; color?: string }) {
  const height = (width * 110) / 240;
  return (
    <Svg width={width} height={height} viewBox="0 0 240 110" opacity={opacity}>
      <G fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M0 18h70l14 14h70l12-12h36" />
        <Circle cx={208} cy={20} r={5} />
        <Path d="M0 42h52l12 12h92l14-14h18" />
        <Circle cx={194} cy={40} r={5} />
        <Path d="M0 66h88l10 10h84" />
        <Circle cx={188} cy={76} r={5} />
        <Path d="M0 90h40l12-12h56l14 14h46" />
        <Circle cx={174} cy={92} r={5} />
        <Path d="M120 54v-18" />
        <Circle cx={120} cy={31} r={4} />
      </G>
    </Svg>
  );
}

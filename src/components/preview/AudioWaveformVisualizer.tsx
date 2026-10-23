import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';

interface AudioWaveformVisualizerProps {
  isActive: boolean;
  barCount?: number;
  color?: string;
  height?: number;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  isActive,
  barCount = 16,
  color = colors.brandCyan,
  height = 36,
}) => {
  const animatedValues = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.18))
  ).current;

  useEffect(() => {
    if (!isActive) {
      animatedValues.forEach(val => val.setValue(0.18));
      return;
    }

    const animations = animatedValues.map((val, idx) => {
      // Create organic wave pattern
      const centerFactor = 1 - Math.abs(idx - barCount / 2) / (barCount / 2);
      const minVal = 0.15;
      const maxVal = Math.min(1.0, 0.4 + centerFactor * 0.6);
      const duration = 200 + Math.random() * 250;

      return Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: maxVal,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: minVal + Math.random() * 0.15,
            duration: duration * 0.9,
            useNativeDriver: true,
          }),
        ])
      );
    });

    Animated.parallel(animations).start();

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [isActive, barCount, animatedValues]);

  return (
    <View style={[styles.container, { height }]}>
      {animatedValues.map((animVal, i) => {
        const isAccent = i % 3 === 0;
        return (
          <Animated.View
            key={i}
            style={[
              styles.bar,
              {
                backgroundColor: isAccent ? '#00E5FF' : color,
                height,
                transform: [{ scaleY: animVal }],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3.5,
    paddingHorizontal: 12,
  },
  bar: {
    width: 3.5,
    borderRadius: 3,
  },
});

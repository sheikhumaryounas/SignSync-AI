import React, { useRef } from 'react';
import { Animated, Pressable, StyleProp, ViewStyle } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TouchFeedbackProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  disabled?: boolean;
}

export const TouchFeedback: React.FC<TouchFeedbackProps> = ({
  children,
  onPress,
  style,
  scaleTo = 0.96,
  disabled = false,
}) => {
  const animatedScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(animatedScale, {
      toValue: scaleTo,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(animatedScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 80,
    }).start();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        style,
        {
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: animatedScale }],
        },
      ]}
    >
      {children}
    </AnimatedPressable>
  );
};

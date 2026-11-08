import React, { useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import { NavigationContext } from '@react-navigation/native';

// Shared motion helpers. Every animation here is skipped when the OS "reduce motion"
// setting is on, so content still appears, just without movement.

export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => live && setReduce(on))
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

interface FadeInProps {
  children: React.ReactNode;
  /** Position in a list; each step adds a short delay for a staggered entrance. */
  index?: number;
  delay?: number;
  /** Starting vertical offset in px. */
  offset?: number;
  style?: StyleProp<ViewStyle>;
}

const STAGGER_MS = 45;
const MAX_STAGGER = 8;

// A focus this soon after the entrance started is the screen's first focus, not a revisit.
const REPLAY_GUARD_MS = 400;

// Fades and lifts its children into place when mounted, and again each time its screen
// regains focus. Tab screens stay mounted, so without the replay a revisited tab (or a
// screen returned to with Back) would appear with no motion at all.
export function FadeIn({ children, index = 0, delay = 0, offset = 10, style }: FadeInProps) {
  const reduce = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;
  // Optional: FadeIn can render outside a navigator (no screen to focus), so read the context directly.
  const navigation = useContext(NavigationContext);

  useEffect(() => {
    if (reduce) {
      progress.setValue(1);
      return;
    }
    let anim: Animated.CompositeAnimation | undefined;
    let startedAt = 0;
    const play = () => {
      anim?.stop();
      startedAt = Date.now();
      progress.setValue(0);
      anim = Animated.timing(progress, {
        toValue: 1,
        duration: 320,
        delay: delay + Math.min(index, MAX_STAGGER) * STAGGER_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
      anim.start();
    };
    play();
    const unsubscribe = navigation?.addListener('focus', () => {
      if (Date.now() - startedAt > REPLAY_GUARD_MS) play();
    });
    return () => {
      unsubscribe?.();
      anim?.stop();
    };
  }, [progress, reduce, delay, index, navigation]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] });
  return <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

// Wraps each child in FadeIn so siblings enter one after another.
// Keys come from Children.toArray, which keeps a child's key stable when a sibling
// before it is conditionally shown or hidden, so nothing remounts or loses state.
export function Stagger({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <>
      {React.Children.toArray(children).map((child, i) => (
        <FadeIn key={React.isValidElement(child) && child.key != null ? child.key : i} index={i} delay={delay}>
          {child}
        </FadeIn>
      ))}
    </>
  );
}

// Springy press feedback: returns a scale value plus handlers to spread on a Pressable.
export function usePressScale(to = 0.97) {
  const scale = useRef(new Animated.Value(1)).current;
  const spring = (toValue: number) =>
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 40, bounciness: toValue === 1 ? 6 : 0 }).start();
  return {
    scale,
    onPressIn: () => spring(to),
    onPressOut: () => spring(1),
  };
}

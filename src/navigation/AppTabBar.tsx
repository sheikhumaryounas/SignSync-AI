import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { fonts, palette, shadow, spacing, useDirection, themedStyles } from '../theme';
import { AppText, IconName } from '../components/ui';
import { useReduceMotion } from '../components/ui/motion';
import { StringKey, useI18n } from '../i18n';

export interface TabMeta {
  label: StringKey;
  icon: IconName;
  iconActive: IconName;
}

// Bottom bar from the designs: active tab gets a teal pill behind its icon.
export function makeTabBar(meta: Record<string, TabMeta>) {
  return function AppTabBar({ state, navigation, insets }: BottomTabBarProps) {
    const { t } = useI18n();
    const { row } = useDirection();
    return (
      <View style={[styles.bar, row, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const m = meta[route.name];
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={t(m.label)}
              style={styles.item}
            >
              <TabPill focused={focused}>
                <Ionicons name={focused ? m.iconActive : m.icon} size={20} color={focused ? palette.tealInk : palette.muted} />
              </TabPill>
              <AppText align="center" style={[styles.label, { color: focused ? palette.navyText : palette.muted, fontFamily: focused ? fonts.semibold : fonts.medium }]}>
                {t(m.label)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    );
  };
}

// The teal pill grows out from the icon and the icon gives a small bounce when its tab is selected.
function TabPill({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  const reduce = useReduceMotion();
  const on = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    const to = focused ? 1 : 0;
    if (reduce) {
      on.setValue(to);
      return;
    }
    Animated.timing(on, { toValue: to, duration: 260, easing: Easing.out(Easing.back(2)), useNativeDriver: true }).start();
  }, [focused, reduce, on]);

  const pillScale = on.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const iconScale = on.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.15, 1] });
  return (
    <View style={styles.pill}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.pillOn, { opacity: on, transform: [{ scaleX: pillScale }] }]} />
      <Animated.View style={{ transform: [{ scale: iconScale }] }}>{children}</Animated.View>
    </View>
  );
}

const styles = themedStyles(() => ({
  bar: {
    backgroundColor: palette.surface,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    boxShadow: shadow.bar,
  },
  item: { flex: 1, alignItems: 'center', gap: 3, minHeight: 48 },
  pill: { width: 40, height: 26, borderRadius: 13, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: palette.tealSoft },
  label: { fontSize: 12, lineHeight: 16 },
}));

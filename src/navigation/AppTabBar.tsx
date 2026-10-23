import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { fonts, palette, shadow, spacing } from '../theme';
import { AppText, IconName } from '../components/ui';
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
    return (
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
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
              <View style={[styles.pill, focused ? styles.pillOn : null]}>
                <Ionicons name={focused ? m.iconActive : m.icon} size={20} color={focused ? palette.tealInk : palette.muted} />
              </View>
              <AppText style={[styles.label, { color: focused ? palette.navy : palette.muted, fontFamily: focused ? fonts.semibold : fonts.medium }]}>
                {t(m.label)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    );
  };
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    boxShadow: shadow.bar,
  },
  item: { flex: 1, alignItems: 'center', gap: 3, minHeight: 48 },
  pill: { width: 52, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: palette.tealSoft },
  label: { fontSize: 10.5, lineHeight: 13 },
});

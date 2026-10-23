import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { fonts, palette, radius } from '../../theme';
import { AppText } from './AppText';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  urdu?: boolean;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'md' | 'sm';
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  style,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const height = size === 'md' ? 36 : 30;

  return (
    <View style={[styles.track, style]} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={opt.label}
            style={[styles.seg, { height }, on ? styles.on : null]}
          >
            <AppText
              variant="bodySm"
              color={on ? palette.navy : palette.ink2}
              // Fixed height + centred text keeps Nastaliq on the same centre line as Latin labels.
              style={opt.urdu ? styles.urdu : { fontFamily: on ? fonts.semibold : fonts.medium }}
            >
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: palette.line2, borderRadius: radius.md, padding: 3, gap: 3 },
  seg: { flex: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  on: { backgroundColor: palette.surface, boxShadow: '0px 1px 3px rgba(0, 35, 88, 0.14)' },
  urdu: { fontFamily: fonts.urdu, fontSize: 13, lineHeight: 24, writingDirection: 'rtl', paddingBottom: 2 },
});

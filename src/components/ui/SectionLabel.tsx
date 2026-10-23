import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { fonts, palette } from '../../theme';
import { AppText } from './AppText';

interface SectionLabelProps {
  label: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionLabel({ label, actionLabel, onAction }: SectionLabelProps) {
  return (
    <View style={styles.row}>
      <AppText variant="label" accessibilityRole="header">
        {label}
      </AppText>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={12} accessibilityRole="button">
          <AppText variant="caption" color={palette.tealInk} style={{ fontFamily: fonts.semibold }}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

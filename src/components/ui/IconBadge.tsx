import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme';
import { IconName } from './icons';

interface IconBadgeProps {
  icon: IconName;
  tone?: 'teal' | 'navy';
  size?: 'md' | 'sm';
}

export function IconBadge({ icon, tone = 'teal', size = 'md' }: IconBadgeProps) {
  const dim = size === 'md' ? 40 : 32;
  return (
    <View
      style={[
        styles.badge,
        { width: dim, height: dim, borderRadius: size === 'md' ? 13 : 10 },
        { backgroundColor: tone === 'teal' ? palette.tealSoft : palette.navySoft },
      ]}
    >
      <Ionicons name={icon} size={size === 'md' ? 20 : 16} color={tone === 'teal' ? palette.tealInk : palette.navy} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
});

import React from 'react';
import { Image, View } from 'react-native';
import { fonts, palette } from '../../theme';
import { AppText } from './AppText';

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

interface AvatarProps {
  name: string;
  uri?: string;
  size?: number;
  /** Ring colour, e.g. to separate the avatar from a navy band. */
  ring?: string;
}

// Profile photo when the user has uploaded one, otherwise their initials.
export function Avatar({ name, uri, size = 56, ring }: AvatarProps) {
  const frame = {
    width: size,
    height: size,
    borderRadius: size / 2,
    overflow: 'hidden' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: ring ? palette.teal : palette.navy,
    borderWidth: ring ? 2 : 0,
    borderColor: ring,
  };
  return (
    <View style={frame} accessibilityElementsHidden importantForAccessibility="no">
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <AppText
          style={{
            fontFamily: fonts.bold,
            fontSize: Math.round(size * 0.36),
            lineHeight: Math.round(size * 0.44),
            color: ring ? palette.onTeal : palette.white,
          }}
        >
          {initials(name)}
        </AppText>
      )}
    </View>
  );
}

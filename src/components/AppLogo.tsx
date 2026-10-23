import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface AppLogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
  showImageOnly?: boolean;
  showTextOnly?: boolean;
  isDark?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'medium',
  showTagline = true,
  showImageOnly = true,
  showTextOnly = false,
  isDark = false,
}) => {
  const getImageDimensions = () => {
    switch (size) {
      case 'small':
        return { width: 42, height: 37 };
      case 'large':
        return { width: 260, height: 231 };
      default:
        return { width: 175, height: 156 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return { fontSize: 18, taglineSize: 8 };
      case 'large':
        return { fontSize: 36, taglineSize: 10 };
      default:
        return { fontSize: 26, taglineSize: 8.5 };
    }
  };

  const imgDim = getImageDimensions();
  const textStyle = getTextSize();

  if (showTextOnly) {
    return (
      <View style={styles.container}>
        <View style={styles.textWrapper}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.brandSignSync,
                { fontSize: textStyle.fontSize, color: isDark ? '#F8FAFC' : colors.brandNavy },
              ]}
            >
              SignSync
            </Text>
            <Text style={[styles.brandAI, { fontSize: textStyle.fontSize }]}>
              AI
            </Text>
          </View>

          {showTagline && size !== 'small' && (
            <View style={styles.taglineWrapper}>
              <View style={styles.taglineDash} />
              <Text
                style={[
                  styles.taglineText,
                  { fontSize: textStyle.taglineSize, color: isDark ? '#94A3B8' : colors.brandNavy },
                ]}
              >
                AI-POWERED BIDIRECTIONAL SIGN LANGUAGE COMMUNICATION
              </Text>
              <View style={styles.taglineDash} />
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo.png')}
        style={[styles.logoImage, { width: imgDim.width, height: imgDim.height }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    marginBottom: 6,
  },
  textWrapper: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandSignSync: {
    fontWeight: '900',
    color: colors.brandNavy,
    letterSpacing: -0.5,
  },
  brandAI: {
    fontWeight: '900',
    color: colors.brandCyan,
    letterSpacing: -0.5,
  },
  taglineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
    paddingHorizontal: 8,
  },
  taglineDash: {
    width: 14,
    height: 1.5,
    backgroundColor: colors.brandCyan,
  },
  taglineText: {
    fontWeight: '700',
    color: colors.brandNavy,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
});

import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { palette, spacing } from '../../theme';
import { AppText, Button, Chip, Screen } from '../../components/ui';
import { LanguageToggle } from '../../components/LanguageToggle';
import { useI18n } from '../../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const { t } = useI18n();

  return (
    <Screen
      white
      scroll={false}
      edges={['top', 'bottom']}
      footer={
        <>
          <Button title={t('welcome.create')} onPress={() => navigation.navigate('Register')} />
          <Button title={t('welcome.signIn')} variant="ghost" onPress={() => navigation.navigate('Login')} />
        </>
      }
    >
      <View style={styles.top}>
        <LanguageToggle />
      </View>
      <View style={styles.hero}>
        <Image
          source={require('../../../assets/logo_cropped.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="SignSync AI"
        />
        <AppText variant="body" align="center" color={palette.ink2} style={styles.copy}>
          {t('welcome.tagline')}
        </AppText>
        <AppText variant="bodySm" align="center" color={palette.tealInk}>
          {t('welcome.taglineUr')}
        </AppText>
        <View style={styles.pills}>
          <Chip label={t('welcome.pillSign')} tone="teal" />
          <Chip label={t('welcome.pillSpeech')} tone="teal" />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'flex-end' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  logo: { width: 220, height: 194, marginBottom: spacing.sm },
  copy: { maxWidth: 280 },
  pills: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});

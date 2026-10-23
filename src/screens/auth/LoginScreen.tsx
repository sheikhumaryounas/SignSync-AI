import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, UserRole } from '../../types';
import { fonts, palette, spacing } from '../../theme';
import { AppText, Button, Chip, Input, Notice, Screen } from '../../components/ui';
import { LanguageToggle } from '../../components/LanguageToggle';
import { useAuth } from '../../context/AuthContext';
import { apiErrorText, StringKey, useI18n } from '../../i18n';
import { validateEmail } from '../../services/api';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../services/api/mock/authMock';
import { AuthHeader } from './AuthHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const demoRoles: { role: UserRole; label: string }[] = [
  { role: 'deaf_mute', label: 'Deaf' },
  { role: 'blind_hearing', label: 'Hearing' },
  { role: 'normal', label: 'Normal' },
  { role: 'admin', label: 'Admin' },
];

export default function LoginScreen({ navigation }: Props) {
  const { t } = useI18n();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const signIn = async (signInEmail: string, signInPassword: string) => {
    setSubmitting(true);
    try {
      // On success the root navigator swaps to the signed-in tree; this screen unmounts.
      await auth.login(signInEmail, signInPassword);
    } catch (e) {
      setPasswordError(apiErrorText(e, t));
      setSubmitting(false);
    }
  };

  const onSubmit = () => {
    const emailCode = validateEmail(email);
    const pwMissing = !password;
    setEmailError(emailCode ? t(`error.${emailCode}` as StringKey) : undefined);
    setPasswordError(pwMissing ? t('error.password_required') : undefined);
    if (!emailCode && !pwMissing) signIn(email, password);
  };

  const demoSignIn = (role: UserRole) => {
    const demo = DEMO_ACCOUNTS[role];
    setEmail(demo.email);
    setPassword(DEMO_PASSWORD);
    setEmailError(undefined);
    setPasswordError(undefined);
    signIn(demo.email, DEMO_PASSWORD);
  };

  return (
    <Screen white edges={['top', 'bottom']} contentStyle={styles.content}>
      <AuthHeader onBack={navigation.canGoBack() ? navigation.goBack : undefined} right={<LanguageToggle />} />

      <View style={styles.title}>
        <AppText variant="display">{t('login.title')}</AppText>
        <AppText variant="bodySm" color={palette.ink2}>
          {t('login.subtitle')}
        </AppText>
      </View>

      <Input
        label={t('common.email')}
        icon="mail-outline"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          if (emailError) setEmailError(undefined);
        }}
        error={emailError}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <Input
        label={t('common.password')}
        icon="lock-closed-outline"
        password
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          if (passwordError) setPasswordError(undefined);
        }}
        error={passwordError}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />

      <Pressable onPress={() => setShowForgot((s) => !s)} hitSlop={12} style={styles.forgot} accessibilityRole="button">
        <AppText variant="caption" color={palette.tealInk} style={styles.link}>
          {t('login.forgot')}
        </AppText>
      </Pressable>
      {showForgot ? <Notice message={t('login.forgotInfo')} /> : null}

      <Button title={t('login.submit')} iconRight="arrow-forward" loading={submitting} onPress={onSubmit} />

      <View style={styles.footer}>
        <AppText variant="bodySm" color={palette.ink2}>
          {t('login.footer')}{' '}
        </AppText>
        <Pressable onPress={() => navigation.navigate('Register')} hitSlop={12} accessibilityRole="link">
          <AppText variant="bodySm" color={palette.tealInk} style={styles.link}>
            {t('login.footerLink')}
          </AppText>
        </Pressable>
      </View>

      {__DEV__ ? (
        <View style={styles.demo}>
          <AppText variant="label" align="center">
            {t('login.demo')}
          </AppText>
          <View style={styles.demoRow}>
            {demoRoles.map((d) => (
              <Chip key={d.role} label={d.label} onPress={() => demoSignIn(d.role)} />
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: spacing.lg, paddingHorizontal: spacing.xl },
  title: { gap: spacing.xs, marginTop: spacing.sm },
  forgot: { alignSelf: 'flex-end', marginTop: -spacing.sm },
  link: { fontFamily: fonts.semibold },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
  demo: { marginTop: 'auto', gap: spacing.sm, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: palette.line2 },
  demoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
});

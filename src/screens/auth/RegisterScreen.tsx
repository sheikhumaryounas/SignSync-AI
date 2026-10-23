import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OutputLanguage, RootStackParamList } from '../../types';
import { fonts, palette, radius, shadow, spacing } from '../../theme';
import { AppText, Button, IconBadge, IconName, Input, Screen, SegmentedControl } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { apiErrorText, StringKey, useI18n } from '../../i18n';
import {
  ApiError,
  passwordStrength,
  SelfRegisterRole,
  validateEmail,
  validateName,
  validatePassword,
} from '../../services/api';
import { AuthHeader } from './AuthHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const roles: { role: SelfRegisterRole; icon: IconName; title: StringKey; who: StringKey; defaults: StringKey }[] = [
  { role: 'deaf_mute', icon: 'hand-left-outline', title: 'register.roleSign', who: 'register.roleSignWho', defaults: 'register.roleSignDefaults' },
  { role: 'blind_hearing', icon: 'volume-medium-outline', title: 'register.roleSpeak', who: 'register.roleSpeakWho', defaults: 'register.roleSpeakDefaults' },
  { role: 'normal', icon: 'keypad-outline', title: 'register.roleType', who: 'register.roleTypeWho', defaults: 'register.roleTypeDefaults' },
];

export default function RegisterScreen({ navigation }: Props) {
  const { t } = useI18n();
  const auth = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<SelfRegisterRole>('deaf_mute');
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>('bilingual');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; submit?: string }>({});
  const [emailTaken, setEmailTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Hardware back on step 2 returns to step 1 instead of leaving the screen.
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (step === 2 && !submitting) {
        e.preventDefault();
        setStep(1);
      }
    });
  }, [navigation, step, submitting]);

  const msg = (code: string | null) => (code ? t(`error.${code}` as StringKey) : undefined);

  const onContinue = () => {
    const next = {
      name: msg(validateName(name)),
      email: msg(validateEmail(email)),
      password: msg(validatePassword(password)),
    };
    setErrors(next);
    setEmailTaken(false);
    if (!next.name && !next.email && !next.password) setStep(2);
  };

  const onCreate = async () => {
    setSubmitting(true);
    setErrors({});
    try {
      await auth.register({ name, email, password, role, outputLanguage });
    } catch (e) {
      setSubmitting(false);
      // EUC5 alt-flow 2.2: a registered email sends the user back with a Sign in option.
      if (e instanceof ApiError && (e.code === 'email_taken' || e.code === 'validation')) {
        setEmailTaken(e.code === 'email_taken');
        const field = e.code === 'email_taken' ? 'email' : (e.details?.field as 'name' | 'email' | 'password');
        setErrors({ [field ?? 'email']: apiErrorText(e, t) });
        setStep(1);
      } else {
        setErrors({ submit: apiErrorText(e, t) });
      }
    }
  };

  const strength = passwordStrength(password);
  const strengthColor = strength >= 3 ? palette.success : strength === 2 ? palette.warning : palette.error;

  if (step === 1) {
    return (
      <Screen
        white
        edges={['top', 'bottom']}
        contentStyle={styles.content}
        footer={
          <>
            <Button title={t('register.continue')} iconRight="arrow-forward" onPress={onContinue} />
            <View style={styles.footerRow}>
              <AppText variant="bodySm" color={palette.ink2}>
                {t('register.footer')}{' '}
              </AppText>
              <Pressable onPress={() => navigation.navigate('Login')} hitSlop={12} accessibilityRole="link">
                <AppText variant="bodySm" color={palette.tealInk} style={styles.link}>
                  {t('register.footerLink')}
                </AppText>
              </Pressable>
            </View>
          </>
        }
      >
        <AuthHeader onBack={navigation.goBack} right={<StepLabel n={1} />} />
        <Progress step={1} />
        <View style={styles.title}>
          <AppText variant="display">{t('register.title1')}</AppText>
          <AppText variant="bodySm" color={palette.ink2}>
            {t('register.subtitle1')}
          </AppText>
        </View>

        <Input
          label={t('register.name')}
          icon="person-outline"
          value={name}
          onChangeText={(v) => {
            setName(v);
            setErrors((e) => ({ ...e, name: undefined }));
          }}
          error={errors.name}
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
        />
        <View style={styles.gapSm}>
          <Input
            label={t('common.email')}
            icon="mail-outline"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setEmailTaken(false);
              setErrors((e) => ({ ...e, email: undefined }));
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
          {emailTaken ? (
            <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8} style={styles.takenLink} accessibilityRole="link">
              <AppText variant="caption" color={palette.tealInk} style={styles.link}>
                {t('error.email_taken_action')}
              </AppText>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.gapSm}>
          <Input
            label={t('common.password')}
            icon="lock-closed-outline"
            password
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setErrors((e) => ({ ...e, password: undefined }));
            }}
            error={errors.password}
            autoComplete="new-password"
            textContentType="newPassword"
          />
          {password && !errors.password ? (
            <View style={styles.gapSm} accessibilityLiveRegion="polite">
              <View style={styles.meter}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={[styles.bar, { backgroundColor: i < strength ? strengthColor : palette.line }]} />
                ))}
              </View>
              <AppText variant="caption" color={strengthColor}>
                {t(`register.strength${strength}` as StringKey)}
              </AppText>
            </View>
          ) : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      edges={['top', 'bottom']}
      contentStyle={styles.content}
      footer={<Button title={t('register.submit')} loading={submitting} onPress={onCreate} />}
    >
      <AuthHeader onBack={() => setStep(1)} right={<StepLabel n={2} />} />
      <Progress step={2} />
      <View style={styles.title}>
        <AppText variant="title">{t('register.title2')}</AppText>
        <AppText variant="bodySm" color={palette.ink2}>
          {t('register.subtitle2')}
        </AppText>
      </View>

      <View style={styles.roles} accessibilityRole="radiogroup">
        {roles.map((r) => {
          const on = r.role === role;
          return (
            <Pressable
              key={r.role}
              onPress={() => setRole(r.role)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${t(r.title)}, ${t(r.who)}. ${t(r.defaults)}`}
              style={[styles.role, on ? styles.roleOn : null]}
            >
              <IconBadge icon={r.icon} tone={on ? 'teal' : 'navy'} />
              <View style={styles.roleText}>
                <AppText variant="heading">{t(r.title)}</AppText>
                <AppText variant="caption">{t(r.who)}</AppText>
                <AppText variant="caption" color={palette.tealInk} style={{ fontFamily: fonts.medium }}>
                  {t(r.defaults)}
                </AppText>
              </View>
              <View style={[styles.radio, on ? styles.radioOn : null]} />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.gapSm}>
        <AppText variant="label">{t('register.outputLanguage')}</AppText>
        <SegmentedControl<OutputLanguage>
          accessibilityLabel={t('register.outputLanguage')}
          value={outputLanguage}
          onChange={setOutputLanguage}
          options={[
            { value: 'english', label: t('register.langEnglish') },
            { value: 'urdu', label: t('register.langUrdu'), urdu: true },
            { value: 'bilingual', label: t('register.langBoth') },
          ]}
        />
      </View>
      {errors.submit ? <AppText variant="caption" color={palette.error}>{errors.submit}</AppText> : null}
    </Screen>
  );
}

function StepLabel({ n }: { n: 1 | 2 }) {
  const { t } = useI18n();
  return <AppText variant="caption">{t('register.step', { n })}</AppText>;
}

function Progress({ step }: { step: 1 | 2 }) {
  return (
    <View style={styles.progress} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.progressBar, styles.progressOn]} />
      <View style={[styles.progressBar, step === 2 ? styles.progressOn : null]} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: spacing.lg, paddingHorizontal: spacing.xl },
  title: { gap: spacing.xs },
  gapSm: { gap: spacing.sm },
  link: { fontFamily: fonts.semibold },
  takenLink: { alignSelf: 'flex-start' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
  meter: { flexDirection: 'row', gap: spacing.xs },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  progress: { flexDirection: 'row', gap: 6, marginTop: -spacing.sm },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: palette.line },
  progressOn: { backgroundColor: palette.teal },
  roles: { gap: spacing.md },
  role: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
    boxShadow: shadow.card,
  },
  roleOn: { borderColor: palette.teal, backgroundColor: palette.tealTint },
  roleText: { flex: 1, gap: 1 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: palette.outline, backgroundColor: palette.surface },
  radioOn: { borderWidth: 6, borderColor: palette.teal },
});

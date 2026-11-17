import React from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { palette, spacing, useDirection, themedStyles } from '../../theme';
import { RootStackParamList } from '../../types';
import { AppText, Card, IconButton, Screen } from '../../components/ui';
import { StringKey, useI18n } from '../../i18n';
import { SUPPORT_EMAIL } from './HelpSupportScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'Legal'>;
export type LegalDoc = 'terms' | 'privacy';

// Bump this whenever the wording of either document changes.
const LAST_UPDATED = '2026-11-17';

const docs: Record<LegalDoc, { title: StringKey; intro: StringKey; sections: number }> = {
  terms: { title: 'profile.terms', intro: 'legal.terms.intro', sections: 8 },
  privacy: { title: 'profile.privacy', intro: 'legal.privacy.intro', sections: 9 },
};

export default function LegalScreen({ navigation, route }: Props) {
  const { t, lang } = useI18n();
  const { row, back } = useDirection();
  const doc = docs[route.params.doc];
  const updated = new Date(LAST_UPDATED).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const sections = Array.from({ length: doc.sections }, (_, i) => `legal.${route.params.doc}.s${i + 1}`);

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={[styles.head, row]}>
        <IconButton icon={back} onPress={navigation.goBack} accessibilityLabel={t('common.back')} />
        <AppText variant="title" accessibilityRole="header" style={styles.flex}>
          {t(doc.title)}
        </AppText>
      </View>

      <View style={styles.intro}>
        <AppText variant="caption">{t('legal.updated', { date: updated })}</AppText>
        <AppText variant="bodySm" color={palette.ink2}>
          {t(doc.intro)}
        </AppText>
      </View>

      <Card style={styles.card}>
        {sections.map((key) => (
          <View key={key} style={styles.section}>
            <AppText variant="heading" accessibilityRole="header">
              {t(`${key}.title` as StringKey)}
            </AppText>
            <AppText variant="bodySm" color={palette.ink2}>
              {t(`${key}.body` as StringKey)}
            </AppText>
          </View>
        ))}
        <View style={styles.section}>
          <AppText variant="heading" accessibilityRole="header">
            {t('legal.contact.title')}
          </AppText>
          <AppText variant="bodySm" color={palette.ink2}>
            {t('legal.contact.body', { email: SUPPORT_EMAIL })}
          </AppText>
        </View>
      </Card>
    </Screen>
  );
}

const styles = themedStyles(() => ({
  head: { alignItems: 'center', gap: spacing.md, minHeight: 44 },
  flex: { flex: 1, minWidth: 0 },
  intro: { gap: spacing.xs },
  card: { gap: spacing.lg },
  section: { gap: spacing.xs },
}));

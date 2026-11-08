import React, { useState } from 'react';
import { Linking, Pressable, View, ViewStyle } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, useDirection, themedStyles } from '../../theme';
import { RootStackParamList } from '../../types';
import { AppText, Card, IconBadge, IconButton, IconName, Screen } from '../../components/ui';
import { useFeedback } from '../../context/FeedbackContext';
import { StringKey, useI18n } from '../../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpSupport'>;

// Where "Email us" and "Report a problem" send mail. Change this to the team's support inbox.
export const SUPPORT_EMAIL = 'support@signsync.ai';
const APP_VERSION = '1.0.0';

const faqs: { q: StringKey; a: StringKey }[] = [
  { q: 'help.faq.signQ', a: 'help.faq.signA' },
  { q: 'help.faq.urduQ', a: 'help.faq.urduA' },
  { q: 'help.faq.historyQ', a: 'help.faq.historyA' },
  { q: 'help.faq.feedbackQ', a: 'help.faq.feedbackA' },
  { q: 'help.faq.privacyQ', a: 'help.faq.privacyA' },
];

export default function HelpSupportScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { notify } = useFeedback();
  const { row, back, forward } = useDirection();
  const [open, setOpen] = useState<StringKey | null>(null);

  const mail = async (subject: string) => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
    try {
      await Linking.openURL(url);
    } catch {
      // No mail app on the device: show the address so the user can write in another way.
      notify({ tone: 'warning', message: t('help.noMailApp', { email: SUPPORT_EMAIL }) });
    }
  };

  const contacts: { icon: IconName; title: StringKey; desc: StringKey; onPress: () => void }[] = [
    { icon: 'mail-outline', title: 'help.emailUs', desc: 'help.emailUsDesc', onPress: () => mail('SignSync AI support') },
    { icon: 'bug-outline', title: 'help.report', desc: 'help.reportDesc', onPress: () => mail(`SignSync AI problem report (v${APP_VERSION})`) },
  ];

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={[styles.head, row]}>
        <IconButton icon={back} onPress={navigation.goBack} accessibilityLabel={t('common.back')} />
        <AppText variant="title" accessibilityRole="header" style={styles.flex}>
          {t('help.title')}
        </AppText>
      </View>

      <AppText variant="label">{t('help.faqTitle')}</AppText>
      <Card padded={false}>
        {faqs.map((f, i) => {
          const expanded = open === f.q;
          return (
            <Pressable
              key={f.q}
              onPress={() => setOpen(expanded ? null : f.q)}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              style={({ pressed }) => [styles.faq, i > 0 ? styles.divider : null, pressed ? { opacity: 0.7 } : null]}
            >
              <View style={[styles.faqHead, row]}>
                <AppText variant="heading" style={styles.flex}>
                  {t(f.q)}
                </AppText>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={palette.muted} />
              </View>
              {expanded ? (
                <AppText variant="bodySm" color={palette.ink2}>
                  {t(f.a)}
                </AppText>
              ) : null}
            </Pressable>
          );
        })}
      </Card>

      <AppText variant="label">{t('help.contactTitle')}</AppText>
      <Card padded={false}>
        {contacts.map((c, i) => (
          <Pressable
            key={c.title}
            onPress={c.onPress}
            accessibilityRole="button"
            style={({ pressed }) => [styles.row, row as ViewStyle, i > 0 ? styles.divider : null, pressed ? { opacity: 0.7 } : null]}
          >
            <IconBadge icon={c.icon} size="sm" tone="teal" />
            <View style={styles.flex}>
              <AppText variant="heading">{t(c.title)}</AppText>
              <AppText variant="caption">{t(c.desc)}</AppText>
            </View>
            <Ionicons name={forward} size={16} color={palette.muted} />
          </Pressable>
        ))}
      </Card>

      <AppText variant="caption" align="center">
        {t('help.version', { v: APP_VERSION })}
      </AppText>
    </Screen>
  );
}

const styles = themedStyles(() => ({
  head: { alignItems: 'center', gap: spacing.md, minHeight: 44 },
  flex: { flex: 1, minWidth: 0 },
  faq: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.sm, minHeight: 56, justifyContent: 'center' },
  faqHead: { alignItems: 'center', gap: spacing.md },
  row: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, minHeight: 56 },
  divider: { borderTopWidth: 1, borderTopColor: palette.line2 },
}));

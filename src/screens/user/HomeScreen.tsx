import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing } from '../../theme';
import { AppText, BrandBand, Card, Chip, EmptyState, IconBadge, IconButton, IconName, SectionLabel, StatusPill } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../context/PreferencesContext';
import { StringKey, useI18n } from '../../i18n';
import { api, SessionSummary } from '../../services/api';
import { channelsLabel, greetingKey, modalityIcon, outputLanguageLabel, signCountLabel, whenLabel } from '../../utils/format';

type PreviewRoute = 'SignRecognition' | 'VoiceSign' | 'TextToSign' | 'BidirectionalChat';

const modes: { route: PreviewRoute; icon: IconName; label: StringKey }[] = [
  { route: 'SignRecognition', icon: 'hand-left-outline', label: 'home.modeSign' },
  { route: 'VoiceSign', icon: 'mic-outline', label: 'home.modeSpeak' },
  { route: 'TextToSign', icon: 'keypad-outline', label: 'home.modeType' },
  { route: 'BidirectionalChat', icon: 'chatbubbles-outline', label: 'home.modeChat' },
];

export default function HomeScreen() {
  // Tab screen that opens sibling tabs and root-stack screens, so it uses the untyped hook.
  const navigation = useNavigation<any>();
  const { user, accessToken } = useAuth();
  const { prefs } = usePreferences();
  const { t, lang } = useI18n();
  const [recent, setRecent] = useState<SessionSummary[] | null>(null);

  // Refresh on every visit so a conversation deleted elsewhere disappears here too.
  useFocusEffect(
    useCallback(() => {
      if (!accessToken) return;
      let live = true;
      api.history
        .list(accessToken, { limit: 3 })
        .then((page) => live && setRecent(page.items))
        .catch(() => live && setRecent([]));
      return () => {
        live = false;
      };
    }, [accessToken])
  );

  const firstName = user?.name.split(' ')[0] ?? '';

  return (
    <View style={styles.root}>
      <BrandBand>
        <View style={styles.headRow}>
          <View style={styles.grow}>
            <AppText variant="caption" color={palette.onNavyMuted}>
              {t(greetingKey())}
            </AppText>
            <AppText variant="title" color={palette.onNavy} numberOfLines={1}>
              {firstName}
            </AppText>
          </View>
          <IconButton icon="person-outline" tone="glass" onPress={() => navigation.navigate('Profile')} accessibilityLabel={t('tab.profile')} />
        </View>
        <View style={styles.prefRow}>
          <Chip label={outputLanguageLabel(prefs.outputLanguage, t)} tone="glass" />
          <Chip label={channelsLabel(prefs, t)} tone="glass" />
          <Pressable
            onPress={() => navigation.navigate('Preferences')}
            style={styles.edit}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('home.editPrefs')}
          >
            <Ionicons name="options-outline" size={16} color={palette.navy} />
          </Pressable>
        </View>
      </BrandBand>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionLabel label={t('home.translate')} />
        <View style={styles.grid}>
          {modes.map((m) => (
            <Card
              key={m.route}
              style={styles.mode}
              onPress={() => navigation.navigate(m.route)}
              accessibilityLabel={`${t(m.label)}, ${t('home.preview')}`}
            >
              <IconBadge icon={m.icon} />
              <AppText variant="heading" numberOfLines={1}>
                {t(m.label)}
              </AppText>
              <StatusPill label={t('home.preview')} tone="info" />
            </Card>
          ))}
        </View>

        <SectionLabel
          label={t('home.recent')}
          actionLabel={recent?.length ? t('home.seeAll') : undefined}
          onAction={() => navigation.navigate('CommunicationHistory')}
        />
        {recent === null ? null : recent.length === 0 ? (
          <Card padded={false}>
            <EmptyState icon="time-outline" title={t('home.emptyTitle')} message={t('home.emptyMsg')} />
          </Card>
        ) : (
          recent.map((s) => (
            <Card
              key={s.id}
              onPress={() => navigation.navigate('SessionDetail', { id: s.id })}
              accessibilityLabel={s.title}
              style={styles.recent}
            >
              <IconBadge icon={modalityIcon[s.modality]} tone={s.modality === 'sign_to_text' ? 'teal' : 'navy'} size="sm" />
              <View style={styles.grow}>
                <AppText variant="heading" numberOfLines={1}>
                  {s.title}
                </AppText>
                <AppText variant="caption" numberOfLines={1}>
                  {whenLabel(s.startedAt, t, lang)}
                  {s.signCount ? ` · ${signCountLabel(s.signCount, t)}` : ''}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={palette.muted} />
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.canvas },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grow: { flex: 1, minWidth: 0 },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  edit: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: palette.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  mode: { width: '48%', flexGrow: 1, gap: spacing.sm + 2 },
  recent: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});

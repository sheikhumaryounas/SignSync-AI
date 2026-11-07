import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, useDirection } from '../../theme';
import { AppText, BrandBand, Card, Chip, EmptyState, IconBadge, IconName, SectionLabel, StatusPill } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../context/PreferencesContext';
import { StringKey, useI18n } from '../../i18n';
import { api, SessionSummary } from '../../services/api';
import { channelsLabel, greetingKey, metaLine, modalityIcon, outputLanguageLabel, signCountLabel, whenLabel } from '../../utils/format';

type PreviewRoute = 'SignRecognition' | 'VoiceSign' | 'TextToSign' | 'BidirectionalChat';

const modes: { route: PreviewRoute; icon: IconName; label: StringKey }[] = [
  { route: 'SignRecognition', icon: 'hand-left-outline', label: 'home.modeSign' },
  { route: 'VoiceSign', icon: 'mic-outline', label: 'home.modeSpeak' },
  { route: 'TextToSign', icon: 'text-outline', label: 'home.modeType' },
  { route: 'BidirectionalChat', icon: 'chatbubbles-outline', label: 'home.modeChat' },
];

export default function HomeScreen() {
  // Tab screen that opens sibling tabs and root-stack screens, so it uses the untyped hook.
  const navigation = useNavigation<any>();
  const { user, accessToken } = useAuth();
  const { prefs } = usePreferences();
  const { t, lang } = useI18n();
  const { row, start, forward } = useDirection();
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
        <View>
          <AppText variant="caption" color={palette.onNavyMuted}>
            {t(greetingKey())}
          </AppText>
          <AppText variant="title" color={palette.onNavy} numberOfLines={1}>
            {firstName}
          </AppText>
        </View>
        <View style={[styles.prefRow, row]}>
          <Chip label={outputLanguageLabel(prefs.outputLanguage, t)} tone="glass" onPress={() => navigation.navigate('Preferences')} accessibilityHint={t('home.editPrefs')} />
          <Chip label={channelsLabel(prefs, t)} tone="glass" onPress={() => navigation.navigate('Preferences')} accessibilityHint={t('home.editPrefs')} />
        </View>
      </BrandBand>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.translateHead, row]}>
          <AppText variant="label" accessibilityRole="header">
            {t('home.translate')}
          </AppText>
          <StatusPill label={t('preview.badge')} tone="info" />
        </View>
        <View style={[styles.grid, row]}>
          {modes.map((m) => (
            <Card
              key={m.route}
              style={{ ...styles.mode, alignItems: start }}
              onPress={() => navigation.navigate(m.route)}
              accessibilityLabel={`${t(m.label)}, ${t('preview.badge')}`}
            >
              <IconBadge icon={m.icon} />
              <AppText variant="heading" numberOfLines={1}>
                {t(m.label)}
              </AppText>
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
              style={[styles.recent, row as ViewStyle]}
            >
              <IconBadge icon={modalityIcon[s.modality]} tone={s.modality === 'sign_to_text' ? 'teal' : 'navy'} size="sm" />
              <View style={styles.grow}>
                <AppText variant="heading" numberOfLines={1}>
                  {s.title}
                </AppText>
                <AppText variant="caption" numberOfLines={1}>
                  {metaLine(whenLabel(s.startedAt, t, lang), ...(s.signCount ? [signCountLabel(s.signCount, t)] : []))}
                </AppText>
              </View>
              <Ionicons name={forward} size={16} color={palette.muted} />
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.canvas },
  grow: { flex: 1, minWidth: 0 },
  prefRow: { alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  translateHead: { alignItems: 'center', justifyContent: 'space-between' },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  grid: { flexWrap: 'wrap', gap: spacing.sm },
  mode: { width: '48%', flexGrow: 1, gap: spacing.sm + 2 },
  recent: { alignItems: 'center', gap: spacing.md },
});

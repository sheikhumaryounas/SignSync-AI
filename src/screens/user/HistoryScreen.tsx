import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, spacing } from '../../theme';
import { AppText, Button, Card, Chip, EmptyState, IconBadge, Input, SectionLabel } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../context/PreferencesContext';
import { StringKey, useI18n } from '../../i18n';
import { api, Modality, SessionSummary } from '../../services/api';
import { dayKey, dayLabel, durationLabel, linesFor, modalityIcon, signCountLabel, timeLabel } from '../../utils/format';

const filters: { value: Modality | undefined; label: StringKey }[] = [
  { value: undefined, label: 'history.all' },
  { value: 'sign_to_text', label: 'mod.sign_to_text' },
  { value: 'speech_to_sign', label: 'mod.speech_to_sign' },
  { value: 'text_to_sign', label: 'mod.text_to_sign' },
];

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const { accessToken } = useAuth();
  const { prefs } = usePreferences();
  const { t, lang } = useI18n();
  const [modality, setModality] = useState<Modality | undefined>();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SessionSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const loadingMore = useRef(false);

  // Debounce typing so each keystroke doesn't hit the API.
  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const load = useCallback(
    async (mode: 'reset' | 'more' | 'refresh') => {
      if (!accessToken) return;
      if (mode === 'more' && (!cursor || loadingMore.current)) return;
      if (mode === 'more') loadingMore.current = true;
      if (mode === 'refresh') setRefreshing(true);
      try {
        const page = await api.history.list(accessToken, { modality, q: query || undefined, cursor: mode === 'more' ? cursor : null });
        setItems((prev) => (mode === 'more' ? [...prev, ...page.items] : page.items));
        setCursor(page.nextCursor);
        setState('ready');
      } catch {
        if (mode !== 'more') setState('error');
      } finally {
        loadingMore.current = false;
        setRefreshing(false);
      }
    },
    [accessToken, modality, query, cursor]
  );

  // Reload when filters change and whenever the tab comes back into view (e.g. after a delete).
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    loadRef.current('reset');
  }, [modality, query]);
  useFocusEffect(
    useCallback(() => {
      loadRef.current('reset');
    }, [])
  );

  // Newest first, grouped by day (EUC8 step 3).
  const sections = useMemo(() => {
    const groups: { title: string; key: string; data: SessionSummary[] }[] = [];
    for (const s of items) {
      const k = dayKey(s.startedAt);
      const last = groups[groups.length - 1];
      if (last && last.key === k) last.data.push(s);
      else groups.push({ key: k, title: dayLabel(s.startedAt, t, lang), data: [s] });
    }
    return groups;
  }, [items, t, lang]);

  const filtered = !!modality || !!query;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.head}>
        <AppText variant="title" accessibilityRole="header">
          {t('history.title')}
        </AppText>
        <Input icon="search-outline" raised placeholder={t('history.search')} value={search} onChangeText={setSearch} returnKeyType="search" accessibilityLabel={t('history.search')} />
        <View style={styles.chips}>
          {filters.map((f) => (
            <Chip key={f.label} label={t(f.label)} selected={modality === f.value} onPress={() => setModality(f.value)} />
          ))}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        onEndReached={() => load('more')}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor={palette.teal} colors={[palette.teal]} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHead}>
            <SectionLabel label={section.title} />
          </View>
        )}
        renderItem={({ item }) => {
          const lines = linesFor(prefs.outputLanguage, item.previewEn, item.previewUr);
          return (
            <Card onPress={() => navigation.navigate('SessionDetail', { id: item.id })} accessibilityLabel={item.title} style={styles.card}>
              <View style={styles.cardHead}>
                <IconBadge icon={modalityIcon[item.modality]} tone={item.modality === 'sign_to_text' ? 'teal' : 'navy'} size="sm" />
                <AppText variant="heading" numberOfLines={1} style={styles.flex}>
                  {item.title}
                </AppText>
                <AppText variant="caption" color={palette.muted}>
                  {timeLabel(item.startedAt, lang)}
                </AppText>
              </View>
              {lines.en ? <AppText variant="bodySm">{lines.en}</AppText> : null}
              {lines.ur ? <AppText variant="urduSm">{lines.ur}</AppText> : null}
              <View style={styles.meta}>
                <AppText variant="caption" color={palette.muted}>
                  {t(`mod.${item.modality}` as StringKey)}
                </AppText>
                {item.signCount ? (
                  <AppText variant="caption" color={palette.muted}>
                    {signCountLabel(item.signCount, t)}
                  </AppText>
                ) : null}
                {item.avgConfidence != null ? (
                  <AppText variant="caption" color={palette.muted}>
                    {t('history.avg', { n: Math.round(item.avgConfidence * 100) })}
                  </AppText>
                ) : null}
                <AppText variant="caption" color={palette.muted}>
                  {durationLabel(item.startedAt, item.endedAt)}
                </AppText>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          state === 'loading' ? null : state === 'error' ? (
            <View style={styles.empty}>
              <EmptyState icon="cloud-offline-outline" title={t('history.loadError')} message={t('error.network')} />
              <Button title={t('common.retry')} variant="ghost" onPress={() => load('reset')} />
            </View>
          ) : filtered ? (
            <EmptyState icon="search-outline" title={t('history.noResults')} message={t('history.noResultsMsg')} />
          ) : (
            <EmptyState
              icon="time-outline"
              title={t('history.emptyTitle')}
              message={t('history.emptyMsg')}
              actionLabel={t('history.emptyAction')}
              onAction={() => navigation.navigate('BidirectionalChat')}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.canvas },
  head: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md, paddingBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  sectionHead: { paddingTop: spacing.sm },
  card: { gap: 6 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, marginBottom: 2 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  empty: { gap: spacing.md },
  flex: { flex: 1 },
});

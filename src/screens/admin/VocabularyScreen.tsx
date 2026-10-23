import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts, palette, radius, shadow, spacing } from '../../theme';
import { AppText, Card, Chip, EmptyState, Input, Notice, SegmentedControl, StatusPill } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { apiErrorText, StringKey, useI18n } from '../../i18n';
import { api, VocabEntry, VocabStatus } from '../../services/api';
import { SignSheet } from './SignSheet';

const statusTone = { active: 'success', training: 'warning', retired: 'muted' } as const;

export default function VocabularyScreen() {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const [list, setList] = useState<VocabEntry[] | null>(null);
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<VocabStatus>('active');
  const [search, setSearch] = useState('');
  const [sheet, setSheet] = useState<{ open: boolean; entry: VocabEntry | null }>({ open: false, entry: null });

  useEffect(() => {
    if (!accessToken) return;
    api.vocabulary
      .list(accessToken)
      .then(setList)
      .catch((e) => setError(apiErrorText(e, t)));
  }, [accessToken, t]);

  const counts = useMemo(() => {
    const c = { active: 0, training: 0, retired: 0 };
    list?.forEach((v) => c[v.status]++);
    return c;
  }, [list]);

  const q = search.trim().toLowerCase();
  const rows = (list ?? []).filter((v) => v.status === status && (!q || v.nameEn.toLowerCase().includes(q) || v.nameUr.includes(search.trim())));

  const upsert = (entry: VocabEntry) =>
    setList((cur) => {
      if (!cur) return [entry];
      return cur.some((v) => v.id === entry.id) ? cur.map((v) => (v.id === entry.id ? entry : v)) : [...cur, entry].sort((a, b) => a.nameEn.localeCompare(b.nameEn));
    });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.head}>
        <View style={styles.titleRow}>
          <View>
            <AppText variant="caption">{t('admin.label')}</AppText>
            <AppText variant="title" accessibilityRole="header">
              {t('vocab.title')}
            </AppText>
          </View>
          {list ? <Chip label={t('vocab.count', { n: list.length })} tone="teal" /> : null}
        </View>
        <SegmentedControl<VocabStatus>
          accessibilityLabel={t('vocab.title')}
          value={status}
          onChange={setStatus}
          options={[
            { value: 'active', label: t('vocab.active', { n: counts.active }) },
            { value: 'training', label: t('vocab.training', { n: counts.training }) },
            { value: 'retired', label: t('vocab.retired', { n: counts.retired }) },
          ]}
        />
        <Input icon="search-outline" raised placeholder={t('vocab.search')} value={search} onChangeText={setSearch} accessibilityLabel={t('vocab.search')} />
        {error ? <Notice tone="error" message={error} /> : null}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(v) => v.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={list ? <EmptyState icon="book-outline" title={t('vocab.empty')} message={t('history.noResultsMsg')} /> : null}
        renderItem={({ item }) => (
          <Card onPress={() => setSheet({ open: true, entry: item })} style={styles.row} accessibilityLabel={`${item.nameEn}, ${t(`status.${item.status}` as StringKey)}`}>
            <View style={styles.flex}>
              <View style={styles.names}>
                <AppText variant="heading">{item.nameEn}</AppText>
                <AppText variant="urduSm" style={styles.urdu}>
                  {item.nameUr}
                </AppText>
              </View>
              <AppText variant="caption" numberOfLines={1}>
                {t(`cat.${item.category}` as StringKey)} · {item.clipCount === 1 ? t('vocab.oneClip') : t('vocab.clips', { n: item.clipCount })}
              </AppText>
            </View>
            <StatusPill label={t(`status.${item.status}` as StringKey)} tone={statusTone[item.status]} />
          </Card>
        )}
      />

      <Pressable
        onPress={() => setSheet({ open: true, entry: null })}
        style={({ pressed }) => [styles.fab, pressed ? { opacity: 0.85 } : null]}
        accessibilityRole="button"
        accessibilityLabel={t('vocab.add')}
      >
        <Ionicons name="add" size={18} color={palette.navy} />
        <AppText style={styles.fabText}>{t('vocab.add')}</AppText>
      </Pressable>

      <SignSheet
        visible={sheet.open}
        entry={sheet.entry}
        all={list ?? []}
        onClose={() => setSheet((s) => ({ ...s, open: false }))}
        onChanged={upsert}
        onOpenExisting={(existing) => {
          setStatus(existing.status);
          setSheet({ open: true, entry: existing });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.canvas },
  head: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 96, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  names: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  urdu: { textAlign: 'left', lineHeight: 24 },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.teal,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    height: 48,
    boxShadow: shadow.fab,
  },
  fabText: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18, color: palette.navy },
  flex: { flex: 1, minWidth: 0 },
});

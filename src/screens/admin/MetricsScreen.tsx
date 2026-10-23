import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fonts, palette, radius, spacing } from '../../theme';
import { AppText, BrandBand, Card, Chip, ConfirmDialog, Notice, SectionLabel, StatusPill } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { apiErrorText, StringKey, useI18n } from '../../i18n';
import { api, FlaggedLog, LATENCY_BUDGET_MS, MetricsSummary, ModelVersion } from '../../services/api';
import { whenLabel } from '../../utils/format';
import { latencyParts, pct, signed } from './metricsFormat';

const RANGES = [7, 30, 90];
const FLAGS_PREVIEW = 3;
const cacheKey = (versionId: string, days: number) => `signsync.metrics.cache.${versionId}.${days}`;

// Fetch a summary; if the service fails, fall back to the last copy with a stale notice (EUC4 exception 1).
async function loadSummary(token: string, versionId: string, days: number): Promise<MetricsSummary> {
  try {
    const fresh = await api.metrics.summary(token, versionId, days);
    AsyncStorage.setItem(cacheKey(versionId, days), JSON.stringify(fresh)).catch(() => undefined);
    return fresh;
  } catch (e) {
    const cached = await AsyncStorage.getItem(cacheKey(versionId, days)).catch(() => null);
    if (cached) return { ...(JSON.parse(cached) as MetricsSummary), stale: true };
    throw e;
  }
}

export default function MetricsScreen() {
  const navigation = useNavigation<any>();
  const { accessToken } = useAuth();
  const { notify } = useFeedback();
  const { t, lang } = useI18n();
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [previous, setPrevious] = useState<MetricsSummary | null>(null);
  const [error, setError] = useState<string>();
  const [flags, setFlags] = useState<FlaggedLog[]>([]);
  const [showAllFlags, setShowAllFlags] = useState(false);
  const [resolving, setResolving] = useState<FlaggedLog | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    api.metrics
      .versions(accessToken)
      .then((list) => {
        setVersions(list);
        setVersionId((list.find((v) => v.status === 'production') ?? list[0])?.id ?? null);
      })
      .catch((e) => setError(apiErrorText(e, t)));
    api.metrics.flagged(accessToken).then(setFlags).catch(() => undefined);
  }, [accessToken, t]);

  // The previous release is the baseline for the deltas shown next to each figure.
  const prevVersion = versions[versions.findIndex((v) => v.id === versionId) + 1];

  const refresh = useCallback(async () => {
    if (!accessToken || !versionId) return;
    setError(undefined);
    try {
      const [cur, prev] = await Promise.all([
        loadSummary(accessToken, versionId, days),
        prevVersion ? loadSummary(accessToken, prevVersion.id, days) : Promise.resolve(null),
      ]);
      setSummary(cur);
      setPrevious(prev);
    } catch (e) {
      setError(apiErrorText(e, t));
    }
  }, [accessToken, versionId, days, prevVersion, t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openFlags = flags.filter((f) => !f.resolved).sort((a, b) => a.confidence - b.confidence);
  const shownFlags = showAllFlags ? openFlags : openFlags.slice(0, FLAGS_PREVIEW);
  const delta = (k: 'accuracy' | 'precision' | 'recall' | 'f1') =>
    summary && previous ? signed((summary[k] - previous[k]) * 100) : null;

  const onResolve = async () => {
    if (!accessToken || !resolving) return;
    await api.metrics.resolveFlag(accessToken, resolving.id);
    setFlags((list) => list.map((f) => (f.id === resolving.id ? { ...f, resolved: true } : f)));
    setResolving(null);
    notify({ tone: 'success', message: t('metrics.resolved') });
  };

  const version = versions.find((v) => v.id === versionId);
  const lat = summary?.latency;
  const overBudget = !!lat && lat.totalMs > LATENCY_BUDGET_MS;

  return (
    <View style={styles.root}>
      <BrandBand circuitPosition="top">
        <View>
          <AppText variant="caption" color={palette.onNavyMuted}>
            {t('admin.label')} · {t('metrics.title')}
          </AppText>
          <View style={styles.versionRow}>
            <AppText variant="title" color={palette.onNavy}>
              {version?.version ?? '—'}
            </AppText>
            {version ? <StatusPill label={t(`metrics.${version.status}` as StringKey)} tone={version.status === 'production' ? 'live' : 'info'} /> : null}
          </View>
        </View>
        <View>
          <AppText style={styles.big}>{summary ? pct(summary.accuracy) : '—'}</AppText>
          <AppText variant="caption" color={palette.onNavyMuted}>
            {t('metrics.accuracy')}
            {delta('accuracy') && prevVersion ? ` · ${t('metrics.vsPrev', { delta: delta('accuracy')!, version: prevVersion.version })}` : ''}
          </AppText>
        </View>
        <View style={styles.chips}>
          {RANGES.map((d) => (
            <Chip key={d} label={t('metrics.days', { n: d })} tone={d === days ? 'tealSolid' : 'glass'} onPress={() => setDays(d)} />
          ))}
          <Chip
            label={t('metrics.compare')}
            tone="glass"
            onPress={() => navigation.navigate('CompareVersions', { a: versionId, b: prevVersion?.id, days })}
          />
        </View>
      </BrandBand>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? <Notice tone="error" message={error} /> : null}
        {summary?.stale ? <Notice tone="warning" message={t('metrics.stale')} /> : null}
        {summary?.example ? <Notice message={t('metrics.example')} /> : null}

        <View style={styles.gap}>
          <AppText variant="label">{t('metrics.version')}</AppText>
          <View style={styles.chips}>
            {versions.map((v) => (
              <Chip key={v.id} label={v.version} selected={v.id === versionId} onPress={() => setVersionId(v.id)} />
            ))}
          </View>
        </View>

        <View style={styles.kpis}>
          {(['precision', 'recall', 'f1'] as const).map((k) => (
            <Card key={k} style={styles.kpi}>
              <AppText variant="label" numberOfLines={1}>
                {t(`metrics.${k}` as StringKey)}
              </AppText>
              <AppText style={styles.kpiValue}>{summary ? pct(summary[k]) : '—'}</AppText>
              {delta(k) ? (
                <AppText variant="caption" color={delta(k)!.startsWith('+') ? palette.success : palette.error}>
                  {delta(k)}
                </AppText>
              ) : null}
            </Card>
          ))}
        </View>

        {lat ? (
          <Card style={styles.gap}>
            <View style={styles.between}>
              <AppText variant="label">{t('metrics.latency')}</AppText>
              <AppText style={styles.latValue}>
                {(lat.totalMs / 1000).toFixed(2)} s{' '}
                <AppText variant="caption" color={palette.muted}>
                  {t('metrics.ofBudget', { s: LATENCY_BUDGET_MS / 1000 })}
                </AppText>
              </AppText>
            </View>
            <View style={styles.stack} accessibilityLabel={`${t('metrics.latency')} ${(lat.totalMs / 1000).toFixed(2)} s`}>
              {latencyParts.map((p) => (
                <View key={p.key} style={{ width: `${(lat[p.key] / Math.max(LATENCY_BUDGET_MS, lat.totalMs)) * 100}%`, backgroundColor: p.color }} />
              ))}
            </View>
            <View style={styles.legend}>
              {latencyParts.map((p) => (
                <View key={p.key} style={styles.legendItem}>
                  <View style={[styles.swatch, { backgroundColor: p.color }]} />
                  <AppText variant="caption">
                    {t(p.label)} {lat[p.key]} ms
                  </AppText>
                </View>
              ))}
            </View>
            {overBudget ? <Notice tone="warning" message={t('metrics.overBudget')} /> : null}
            <AppText variant="caption" color={palette.muted}>
              {t('metrics.sessions', { n: summary!.sessions })}
            </AppText>
          </Card>
        ) : null}

        <SectionLabel
          label={t('metrics.flagged')}
          actionLabel={openFlags.length > FLAGS_PREVIEW ? (showAllFlags ? t('metrics.showLess') : t('metrics.showAll', { n: openFlags.length })) : undefined}
          onAction={() => setShowAllFlags((s) => !s)}
        />
        {openFlags.length === 0 ? (
          <AppText variant="caption">{t('metrics.allClear')}</AppText>
        ) : (
          shownFlags.map((f) => (
            <Card key={f.id} onPress={() => setResolving(f)} style={styles.flag} accessibilityLabel={`${f.predictedSign} ${f.confidence.toFixed(2)}`}>
              <View style={styles.flex}>
                <AppText variant="heading">{f.predictedSign}</AppText>
                <AppText variant="caption" numberOfLines={1}>
                  {f.confirmedSign ? `${t('metrics.confirmedAs', { sign: f.confirmedSign })} · ` : ''}
                  {t('metrics.flagLine', { ref: f.sessionRef, when: whenLabel(f.createdAt, t, lang) })}
                </AppText>
              </View>
              <View style={styles.conf}>
                <AppText style={styles.confText}>{f.confidence.toFixed(2)}</AppText>
              </View>
            </Card>
          ))
        )}
        {openFlags.length ? (
          <AppText variant="caption" color={palette.muted}>
            {t('metrics.open', { n: openFlags.length })}
          </AppText>
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={!!resolving}
        title={t('metrics.resolveTitle')}
        message={t('metrics.resolveMsg')}
        confirmLabel={t('metrics.resolve')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setResolving(null)}
        onConfirm={onResolve}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.canvas },
  versionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  big: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 40, letterSpacing: -0.6, color: palette.onNavy },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  gap: { gap: spacing.sm },
  kpis: { flexDirection: 'row', gap: spacing.sm },
  kpi: { flex: 1, gap: 2, padding: spacing.md - 2 },
  kpiValue: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: palette.navy },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  latValue: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20, color: palette.navy },
  stack: { flexDirection: 'row', height: 10, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: palette.line2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 },
  legendItem: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 8, height: 8, borderRadius: 2 },
  flag: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  conf: { backgroundColor: palette.errorSoft, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  confText: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, color: palette.error },
  flex: { flex: 1, minWidth: 0 },
});

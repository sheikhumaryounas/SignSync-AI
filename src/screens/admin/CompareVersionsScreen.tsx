import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fonts, palette, radius, spacing } from '../../theme';
import { AppText, Card, IconButton, Notice, Screen } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { apiErrorText, StringKey, useI18n } from '../../i18n';
import { api, MetricsSummary, ModelVersion } from '../../services/api';
import { RootStackParamList } from '../../types';
import { pct, signed } from './metricsFormat';

type Props = NativeStackScreenProps<RootStackParamList, 'CompareVersions'>;

interface Row {
  label: StringKey;
  a: string;
  b: string;
  diff: string;
  better: boolean;
}

// EUC4 alt-flow 6.1 / TC-ADM-06: two model versions side by side.
export default function CompareVersionsScreen({ navigation, route }: Props) {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const days = route.params?.days ?? 30;
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [aId, setAId] = useState(route.params?.a ?? null);
  const [bId, setBId] = useState(route.params?.b ?? null);
  const [a, setA] = useState<MetricsSummary | null>(null);
  const [b, setB] = useState<MetricsSummary | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!accessToken) return;
    api.metrics.versions(accessToken).then((list) => {
      setVersions(list);
      setAId((cur) => cur ?? list[0]?.id ?? null);
      setBId((cur) => cur ?? list[1]?.id ?? null);
    });
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !aId || !bId) return;
    setError(undefined);
    Promise.all([api.metrics.summary(accessToken, aId, days), api.metrics.summary(accessToken, bId, days)])
      .then(([sa, sb]) => {
        setA(sa);
        setB(sb);
      })
      .catch((e) => setError(apiErrorText(e, t)));
  }, [accessToken, aId, bId, days, t]);

  // Tapping a side moves it to the next version that isn't already on the other side.
  const cycle = (current: string | null, other: string | null) => {
    if (!versions.length) return current;
    const start = versions.findIndex((v) => v.id === current);
    for (let i = 1; i <= versions.length; i++) {
      const next = versions[(start + i) % versions.length];
      if (next.id !== other) return next.id;
    }
    return current;
  };

  const rows: Row[] =
    a && b
      ? [
          ...(['accuracy', 'precision', 'recall', 'f1'] as const).map((k) => ({
            label: `metrics.${k}` as StringKey,
            a: pct(a[k]),
            b: pct(b[k]),
            diff: signed((a[k] - b[k]) * 100),
            better: a[k] >= b[k],
          })),
          {
            label: 'metrics.latency',
            a: `${(a.latency.totalMs / 1000).toFixed(2)} s`,
            b: `${(b.latency.totalMs / 1000).toFixed(2)} s`,
            diff: `${signed((a.latency.totalMs - b.latency.totalMs) / 1000, 2)} s`,
            better: a.latency.totalMs <= b.latency.totalMs,
          },
          {
            label: 'metrics.inference',
            a: `${a.latency.inferenceMs} ms`,
            b: `${b.latency.inferenceMs} ms`,
            diff: `${signed(a.latency.inferenceMs - b.latency.inferenceMs, 0)} ms`,
            better: a.latency.inferenceMs <= b.latency.inferenceMs,
          },
        ]
      : [];

  const weakest = a ? [...a.perClass].sort((x, y) => x.accuracy - y.accuracy).slice(0, 3) : [];
  const vA = versions.find((v) => v.id === aId);
  const vB = versions.find((v) => v.id === bId);

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.head}>
        <IconButton icon="chevron-back" onPress={navigation.goBack} accessibilityLabel={t('common.back')} />
        <AppText variant="caption">{t('metrics.days', { n: days })}</AppText>
      </View>
      <AppText variant="title" accessibilityRole="header">
        {t('compare.title')}
      </AppText>

      <View style={styles.vs}>
        <Pressable onPress={() => setAId(cycle(aId, bId))} style={[styles.pill, styles.pillA]} accessibilityRole="button" accessibilityHint={t('compare.tapToSwitch')}>
          <AppText style={[styles.pillText, { color: palette.white }]}>{vA?.version ?? '—'}</AppText>
        </Pressable>
        <AppText variant="caption" color={palette.muted}>
          vs
        </AppText>
        <Pressable onPress={() => setBId(cycle(bId, aId))} style={[styles.pill, styles.pillB]} accessibilityRole="button" accessibilityHint={t('compare.tapToSwitch')}>
          <AppText style={[styles.pillText, { color: palette.navy }]}>{vB?.version ?? '—'}</AppText>
        </Pressable>
      </View>
      <AppText variant="caption" align="center">
        {t('compare.tapToSwitch')}
      </AppText>

      {error ? <Notice tone="error" message={error} /> : null}
      {a?.example ? <Notice message={t('metrics.example')} /> : null}

      <Card style={styles.table}>
        <View style={[styles.tr, styles.th]}>
          <AppText variant="label" style={styles.c1}>{t('compare.metric')}</AppText>
          <AppText variant="label" style={styles.cn}>{vA?.version.replace(/\.0$/, '')}</AppText>
          <AppText variant="label" style={styles.cn}>{vB?.version.replace(/\.0$/, '')}</AppText>
          <AppText variant="label" style={styles.cn}>{t('compare.change')}</AppText>
        </View>
        {rows.map((r) => (
          <View key={r.label} style={[styles.tr, styles.rowLine]}>
            <AppText variant="bodySm" style={styles.c1} numberOfLines={1}>
              {t(r.label)}
            </AppText>
            <AppText style={[styles.cn, styles.strong]}>{r.a}</AppText>
            <AppText variant="bodySm" style={styles.cn} color={palette.ink2}>
              {r.b}
            </AppText>
            <AppText style={[styles.cn, styles.diff, { color: r.better ? palette.success : palette.error }]}>{r.diff}</AppText>
          </View>
        ))}
      </Card>

      <AppText variant="label">{t('compare.weakest')}</AppText>
      <Card style={styles.bars}>
        {weakest.map((w) => {
          const other = b?.perClass.find((p) => p.sign === w.sign)?.accuracy ?? 0;
          return (
            <View key={w.sign} style={styles.barRow}>
              <AppText variant="bodySm" style={styles.barLabel} numberOfLines={1}>
                {w.sign}
              </AppText>
              <View style={styles.pair}>
                <View style={[styles.bar, { width: `${w.accuracy * 100}%`, backgroundColor: palette.navy }]} />
                <View style={[styles.bar, { width: `${other * 100}%`, backgroundColor: palette.chartBlue }]} />
              </View>
              <AppText style={[styles.barValue, styles.strong]}>{Math.round(w.accuracy * 100)}%</AppText>
            </View>
          );
        })}
        <View style={styles.key}>
          <View style={styles.keyItem}>
            <View style={[styles.swatch, { backgroundColor: palette.navy }]} />
            <AppText variant="caption">{vA?.version}</AppText>
          </View>
          <View style={styles.keyItem}>
            <View style={[styles.swatch, { backgroundColor: palette.chartBlue }]} />
            <AppText variant="caption">{vB?.version}</AppText>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vs: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pill: { flex: 1, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  pillA: { backgroundColor: palette.navy },
  pillB: { backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.chartBlue },
  pillText: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18 },
  table: { paddingVertical: spacing.xs },
  tr: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: spacing.sm },
  th: { paddingTop: spacing.sm },
  rowLine: { borderTopWidth: 1, borderTopColor: palette.line2 },
  c1: { flex: 1.3 },
  cn: { flex: 1, textAlign: 'right' },
  strong: { fontFamily: fonts.semibold, fontSize: 12.5, lineHeight: 18, color: palette.navy },
  diff: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 18 },
  bars: { gap: spacing.md },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barLabel: { width: 76 },
  pair: { flex: 1, gap: 3 },
  bar: { height: 6, borderRadius: 3 },
  barValue: { width: 38, textAlign: 'right' },
  key: { flexDirection: 'row', gap: spacing.lg, paddingLeft: 84 },
  keyItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 6, borderRadius: 2 },
});

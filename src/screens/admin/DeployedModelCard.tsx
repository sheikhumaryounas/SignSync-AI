import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { fonts, palette, radius, spacing, themedStyles } from '../../theme';
import { AppText, Card, StatusPill } from '../../components/ui';
import { useI18n } from '../../i18n';
import { signName } from '../../services/preview/aiEngine';
import { aslSign } from '../../services/recognition/aslSigns';
import { fetchModelInfo, ModelInfo } from '../../services/recognition/signApi';
import { pct } from './metricsFormat';

const PREVIEW = 5;

// The sign model the recognition server actually runs, with its held-out test results.
// Unlike the figures below it, these come from the real model (server/model_info.json).
export function DeployedModelCard({ refreshKey }: { refreshKey?: number }) {
  const { t, lang } = useI18n();
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [offline, setOffline] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(() => {
    fetchModelInfo()
      .then((m) => {
        setInfo(m);
        setOffline(false);
      })
      .catch(() => setOffline(true));
  }, []);

  useEffect(load, [load, refreshKey]);

  // Weakest first: those are the signs worth more training clips.
  const signs = [...(info?.perSign ?? [])].sort((a, b) => a.accuracy - b.accuracy);
  const shown = showAll ? signs : signs.slice(0, PREVIEW);

  return (
    <Card style={styles.card}>
      <View style={styles.between}>
        <AppText variant="label">{t('model.title')}</AppText>
        <StatusPill label={offline ? t('model.offline') : info ? t('model.online') : '…'} tone={offline ? 'warning' : 'live'} />
      </View>

      {offline ? (
        <AppText variant="bodySm" color={palette.ink2}>
          {t('model.offlineHint')}
        </AppText>
      ) : info ? (
        <>
          <View style={styles.gapXs}>
            <AppText variant="heading">{info.name}</AppText>
            <AppText variant="caption">{info.trainedOn}</AppText>
          </View>
          <View style={styles.row}>
            <AppText style={styles.big}>{pct(info.testAccuracy)}</AppText>
            <AppText variant="caption" style={styles.flex}>
              {t('model.testAccuracy', { n: info.testSigners, signs: info.perSign.length })}
            </AppText>
          </View>

          <AppText variant="label">{t('model.perSign')}</AppText>
          {shown.map((s) => {
            const sign = aslSign(s.label);
            const weak = s.accuracy < 0.8;
            return (
              <View key={s.label} style={styles.gapXs}>
                <View style={styles.between}>
                  <AppText variant="bodySm">{sign ? signName(sign, lang) : s.label}</AppText>
                  <AppText variant="caption" color={weak ? palette.warning : palette.ink2}>
                    {pct(s.accuracy)}
                  </AppText>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${s.accuracy * 100}%`, backgroundColor: weak ? palette.warning : palette.teal }]} />
                </View>
              </View>
            );
          })}
          {signs.length > PREVIEW ? (
            <Pressable onPress={() => setShowAll((v) => !v)} hitSlop={8} accessibilityRole="button" style={styles.toggle}>
              <AppText variant="caption" color={palette.tealInk} style={styles.link}>
                {showAll ? t('metrics.showLess') : t('metrics.showAll', { n: signs.length })}
              </AppText>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

const styles = themedStyles(() => ({
  card: { gap: spacing.md },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  gapXs: { gap: 4 },
  flex: { flex: 1 },
  big: { fontFamily: fonts.semibold, fontSize: 28, lineHeight: 34, color: palette.navyText },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: palette.line2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  toggle: { alignSelf: 'flex-start' },
  link: { fontFamily: fonts.semibold },
}));

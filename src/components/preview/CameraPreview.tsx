import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fonts, palette, radius, spacing, useDirection } from '../../theme';
import { AppText, IconButton } from '../ui';
import { useI18n } from '../../i18n';
import { generateSimulatedLandmarks, MediaPipeFrame } from '../../services/preview/aiEngine';

interface CameraPreviewProps {
  scanning: boolean;
  showPoints: boolean;
  onTogglePoints: () => void;
  /** Result tag, e.g. "Doctor · 95%". Hidden until a sign has been recognised. */
  result?: string;
}

// Stand-in for the live camera. It is plainly labelled as simulated and makes no performance claims.
export function CameraPreview({ scanning, showPoints, onTogglePoints, result }: CameraPreviewProps) {
  const { t } = useI18n();
  const { row } = useDirection();
  const [frame, setFrame] = useState<MediaPipeFrame>(() => generateSimulatedLandmarks(0));

  useEffect(() => {
    if (!scanning) return;
    const id = setInterval(() => setFrame(generateSimulatedLandmarks(0)), 120);
    return () => clearInterval(id);
  }, [scanning]);

  return (
    <View style={styles.frame}>
      {showPoints ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {frame.handRight.map((p, i) => (
            <View key={`r${i}`} style={[styles.point, styles.pointRight, { left: `${p.x * 100}%`, top: `${p.y * 100}%` }]} />
          ))}
          {frame.handLeft.map((p, i) => (
            <View key={`l${i}`} style={[styles.point, styles.pointLeft, { left: `${p.x * 100}%`, top: `${p.y * 100}%` }]} />
          ))}
        </View>
      ) : null}

      <View style={[styles.top, row]}>
        <View style={styles.tag}>
          <AppText style={styles.tagText}>{scanning ? t('rec.camera') : t('rec.paused')}</AppText>
        </View>
        <IconButton
          icon={showPoints ? 'eye-off-outline' : 'eye-outline'}
          tone="glass"
          accessibilityLabel={showPoints ? t('rec.hidePoints') : t('rec.showPoints')}
          onPress={onTogglePoints}
        />
      </View>

      {result ? (
        <View style={styles.result} accessibilityLiveRegion="polite">
          <AppText style={styles.resultText}>{result}</AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 220, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: palette.navy },
  point: { position: 'absolute', width: 7, height: 7, borderRadius: 4 },
  pointRight: { backgroundColor: palette.teal },
  pointLeft: { backgroundColor: palette.tealOnNavy },
  top: { alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  tag: { backgroundColor: palette.glass, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  tagText: { fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 18, color: palette.white },
  result: {
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
    backgroundColor: palette.teal,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
  },
  resultText: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: palette.navy },
});

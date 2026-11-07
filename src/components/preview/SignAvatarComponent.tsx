import React, { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { palette, radius, spacing, useDirection } from '../../theme';
import { SignVocabularyItem } from '../../types';
import { AppText, Button, Card, Chip, IconButton, SegmentedControl, StatusPill } from '../ui';
import { usePreview } from '../../context/PreviewContext';
import { useI18n } from '../../i18n';
import { signDescription, signName, signNameUr } from '../../services/preview/aiEngine';
import { HandPose, HandShape, restPose, signPoses } from './signPoses';

const SIGN_DURATION_MS = 2400;
const SPEEDS = ['0.5', '1', '1.5'] as const;
type Speed = (typeof SPEEDS)[number];

const SHOULDER_Y = 84;
const SHOULDER_RIGHT = 92;
const SHOULDER_LEFT = 148;
const UPPER_ARM = 46;
const FOREARM = 48;

// Where a hand is at this point in its motion. `phase` runs from 0 to 1 and repeats.
function handAt(pose: HandPose, phase: number) {
  const turn = phase * Math.PI * 2;
  if (pose.circle) {
    return { x: pose.x + Math.cos(turn) * pose.circle, y: pose.y + Math.sin(turn) * pose.circle };
  }
  const amount = 0.5 - Math.cos(turn) / 2;
  return { x: pose.x + (pose.dx ?? 0) * amount, y: pose.y + (pose.dy ?? 0) * amount };
}

// Two-bone arm: finds the elbow joining the shoulder to the hand, bending away from the body.
function elbowFor(shoulderX: number, hand: { x: number; y: number }, side: -1 | 1) {
  const dx = hand.x - shoulderX;
  const dy = hand.y - SHOULDER_Y;
  const reach = Math.min(Math.hypot(dx, dy), UPPER_ARM + FOREARM - 1) || 1;
  const along = (UPPER_ARM * UPPER_ARM - FOREARM * FOREARM + reach * reach) / (2 * reach);
  const out = Math.sqrt(Math.max(UPPER_ARM * UPPER_ARM - along * along, 0));
  const ux = dx / reach;
  const uy = dy / reach;
  // Of the two possible elbows, take the one on the outer side of the body.
  const a = { x: shoulderX + ux * along - uy * out, y: SHOULDER_Y + uy * along + ux * out };
  const b = { x: shoulderX + ux * along + uy * out, y: SHOULDER_Y + uy * along - ux * out };
  return (a.x - b.x) * side > 0 ? a : b;
}

const FINGERS: Record<HandShape, number> = { fist: 0, point: 1, two: 2, three: 3, open: 5 };

function Hand({ x, y, shape, color }: { x: number; y: number; shape: HandShape; color: string }) {
  const count = FINGERS[shape];
  const spread = count > 1 ? 1.5 / (count - 1) : 0;
  return (
    <G>
      {Array.from({ length: count }, (_, i) => {
        const angle = -Math.PI / 2 + (count > 1 ? -0.75 + i * spread : 0);
        return (
          <Line
            key={i}
            x1={x + Math.cos(angle) * 6}
            y1={y + Math.sin(angle) * 6}
            x2={x + Math.cos(angle) * 16}
            y2={y + Math.sin(angle) * 16}
            stroke={color}
            strokeWidth={3.6}
            strokeLinecap="round"
          />
        );
      })}
      <Circle cx={x} cy={y} r={8.5} fill={color} />
    </G>
  );
}

function Figure({ sign, phase }: { sign?: SignVocabularyItem; phase: number }) {
  const pose = (sign && signPoses[sign.id]) || restPose;
  const right = handAt(pose.right, phase);
  const left = handAt(pose.left, phase);
  const rightElbow = elbowFor(SHOULDER_RIGHT, right, -1);
  const leftElbow = elbowFor(SHOULDER_LEFT, left, 1);

  const arm = (shoulderX: number, elbow: { x: number; y: number }, hand: { x: number; y: number }, color: string) => (
    <Path
      d={`M ${shoulderX} ${SHOULDER_Y} L ${elbow.x} ${elbow.y} L ${hand.x} ${hand.y}`}
      stroke={color}
      strokeWidth={11}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );

  return (
    <Svg viewBox="0 0 240 200" width="100%" height={200}>
      {/* Body */}
      <Rect x={86} y={74} width={68} height={126} rx={22} fill={palette.navy} />
      <Rect x={112} y={58} width={16} height={20} fill={palette.navySoft} />
      {/* Head, kept neutral: faces carry grammar in sign language, so the real avatar needs a full one. */}
      <Circle cx={120} cy={40} r={25} fill={palette.navySoft} stroke={palette.navy} strokeWidth={2.5} />
      <Circle cx={111} cy={37} r={2.6} fill={palette.navy} />
      <Circle cx={129} cy={37} r={2.6} fill={palette.navy} />
      <Path d="M 112 49 Q 120 54 128 49" stroke={palette.navy} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      {/* Arms and hands */}
      {arm(SHOULDER_LEFT, leftElbow, left, palette.navy2)}
      {arm(SHOULDER_RIGHT, rightElbow, right, palette.navy2)}
      <Hand x={left.x} y={left.y} shape={pose.left.shape} color={palette.tealInk} />
      <Hand x={right.x} y={right.y} shape={pose.right.shape} color={palette.teal} />
    </Svg>
  );
}

// Plays a sequence of signs on a placeholder figure. Clearly labelled as an illustration: the real
// avatar is FYP-2 work, and the written description below stays the usable instruction.
export const SignAvatarComponent: React.FC<{ signs: SignVocabularyItem[] }> = ({ signs }) => {
  const { t, lang } = useI18n();
  const { row } = useDirection();
  const { speakText, stopSpeaking, isSpeaking, preferences } = usePreview();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<Speed>(preferences.avatarSpeed === 1 ? '1' : '1');
  const [phase, setPhase] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const multiplier = Number(speed);
  // The parent recalculates the list on every keystroke; only a change in signs restarts playback.
  const signsKey = useMemo(() => signs.map((s) => s.id).join(','), [signs]);
  const sign = signs[index] ?? signs[0];

  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => live && setReduceMotion(on))
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    setIndex(0);
    setPlaying(true);
  }, [signsKey]);

  // The hand motion. Skipped under reduce-motion; the sign still advances and is described in text.
  useEffect(() => {
    if (!playing || reduceMotion || !signsKey) return;
    const startedAt = Date.now();
    const id = setInterval(() => setPhase((((Date.now() - startedAt) * multiplier) / 1200) % 1), 50);
    return () => clearInterval(id);
  }, [playing, reduceMotion, signsKey, multiplier]);

  useEffect(() => {
    if (!playing) return;
    const total = signsKey ? signsKey.split(',').length : 0;
    if (total <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), SIGN_DURATION_MS / multiplier);
    return () => clearInterval(id);
  }, [playing, signsKey, multiplier]);

  return (
    <Card style={styles.card}>
      <View style={[styles.head, row]}>
        <AppText variant="heading" accessibilityRole="header">
          {t('avatar.title')}
        </AppText>
        {signs.length > 1 ? <StatusPill label={t('avatar.step', { n: index + 1, total: signs.length })} tone="info" /> : null}
      </View>

      <View style={styles.stage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Figure sign={sign} phase={phase} />
      </View>

      {sign ? (
        <>
          <View style={[styles.signRow, row]} accessibilityLiveRegion="polite">
            <View style={styles.flex}>
              <AppText variant="title">{signName(sign, lang)}</AppText>
              <AppText variant="bodySm" color={palette.ink2}>
                {signDescription(sign, lang)}
              </AppText>
            </View>
            <IconButton
              icon={isSpeaking ? 'stop' : 'volume-high-outline'}
              tone="outline"
              accessibilityLabel={isSpeaking ? t('preview.stopSpeaking') : t('avatar.sayName')}
              onPress={() => (isSpeaking ? stopSpeaking() : speakText(lang === 'ur' ? signNameUr(sign) : signName(sign, 'en')))}
            />
          </View>

          {signs.length > 1 ? (
            <View style={[styles.chips, row]}>
              {signs.map((s, i) => (
                <Chip key={s.id} label={`${i + 1}. ${signName(s, lang)}`} selected={i === index} onPress={() => setIndex(i)} />
              ))}
            </View>
          ) : null}

          <View style={[styles.controls, row]}>
            <Button
              title={playing ? t('avatar.pause') : t('avatar.play')}
              icon={playing ? 'pause' : 'play'}
              variant="ghost"
              fullWidth={false}
              style={styles.control}
              onPress={() => setPlaying((p) => !p)}
            />
            <Button
              title={t('avatar.replay')}
              icon="reload-outline"
              variant="ghost"
              fullWidth={false}
              style={styles.control}
              onPress={() => {
                setIndex(0);
                setPlaying(true);
              }}
            />
            <SegmentedControl<Speed>
              size="sm"
              style={styles.speed}
              accessibilityLabel={t('avatar.speed')}
              value={speed}
              onChange={setSpeed}
              options={SPEEDS.map((s) => ({ value: s, label: `${s}x` }))}
            />
          </View>
        </>
      ) : (
        <AppText variant="bodySm" align="center" color={palette.ink2}>
          {t('avatar.empty')}
        </AppText>
      )}

      <AppText variant="caption" color={palette.ink2}>
        {t('avatar.note')}
      </AppText>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  head: { alignItems: 'center', justifyContent: 'space-between', minHeight: 24 },
  stage: { backgroundColor: palette.tealTint, borderRadius: radius.md, overflow: 'hidden' },
  signRow: { alignItems: 'flex-start', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  chips: { flexWrap: 'wrap', gap: spacing.sm },
  controls: { flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  control: { minHeight: 44, paddingHorizontal: spacing.md },
  speed: { minWidth: 138, flexGrow: 1 },
});

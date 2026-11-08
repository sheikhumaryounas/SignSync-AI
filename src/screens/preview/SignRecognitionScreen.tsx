import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fonts, palette, radius, spacing, useDirection, themedStyles } from '../../theme';
import { RootStackParamList, SignVocabularyItem } from '../../types';
import { AppText, Button, Card, Chip, Screen, StatusPill } from '../../components/ui';
import { usePreview } from '../../context/PreviewContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useI18n } from '../../i18n';
import { HeaderBar } from '../../components/preview/HeaderBar';
import { CameraPreview } from '../../components/preview/CameraPreview';
import { RepeatSignModal } from '../../components/preview/RepeatSignModal';
import { correctSignSequence, recognizeSignLandmarks, signName, signNameEn } from '../../services/preview/aiEngine';
import { linesFor } from '../../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'SignRecognition'>;

interface Captured {
  sign: SignVocabularyItem;
  confidence: number;
}

export default function SignRecognitionScreen({ navigation, route }: Props) {
  const { preferences, vocabulary, addSession, speakText, isSpeaking, stopSpeaking } = usePreview();
  const { notify } = useFeedback();
  const { t, lang } = useI18n();
  const { row } = useDirection();
  const openedAt = useRef(Date.now());
  const [scanning, setScanning] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [captured, setCaptured] = useState<Captured[]>([]);
  const [unclear, setUnclear] = useState<Captured | null>(null);

  const threshold = preferences.confidenceThreshold;
  const signs = captured.map((c) => c.sign);
  const last = captured[captured.length - 1];
  const corrected = correctSignSequence(signs.map(signNameEn));
  const lines = linesFor(preferences.outputLanguage, corrected.english, corrected.urdu);

  const perform = (sign: SignVocabularyItem, confidence: number) => {
    const result = recognizeSignLandmarks(sign, confidence);
    // A low score never becomes output: the signer is asked to repeat it instead.
    if (result.confidence < threshold) {
      setUnclear({ sign: result.sign, confidence: result.confidence });
      return;
    }
    if (captured.length === 0) speakText(signName(result.sign, lang), { auto: true });
    setCaptured((prev) => [...prev, { sign: result.sign, confidence: result.confidence }]);
  };

  useEffect(() => {
    const target = route.params?.targetSignId;
    const found = target ? vocabulary.find((v) => v.id === target) : undefined;
    if (found) perform(found, 0.95);
    // Only a new target from navigation should trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.targetSignId]);

  const clear = () => {
    setCaptured([]);
    stopSpeaking();
  };

  const onSave = () => {
    if (captured.length === 0) {
      notify({ tone: 'warning', message: t('preview.nothingToSave') });
      return;
    }
    const names = signs.map(signNameEn);
    addSession({
      userId: preferences.userId,
      title: `${t('home.modeSign')}: ${names.slice(0, 2).join(', ')}`,
      modality: 'sign_to_text',
      inputText: names.join(', '),
      outputTextUrdu: corrected.urdu,
      outputTextEnglish: corrected.english,
      signSequence: names,
      averageConfidence: captured.reduce((sum, c) => sum + c.confidence, 0) / captured.length,
      duration: `${Math.max(1, Math.round((Date.now() - openedAt.current) / 1000))}s`,
      feedbackGiven: 'up',
    });
    notify({ tone: 'success', message: t('preview.saved') });
  };

  const onSpeak = () => {
    if (isSpeaking) stopSpeaking();
    else speakText(preferences.outputLanguage === 'english' ? corrected.english : corrected.urdu);
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      contentStyle={styles.content}
      header={
        <HeaderBar
          title={t('home.modeSign')}
          onBack={navigation.goBack}
          rightAction={
            <Button
              title={scanning ? t('rec.pause') : t('rec.resume')}
              icon={scanning ? 'pause' : 'play'}
              variant="ghost"
              fullWidth={false}
              style={styles.headerAction}
              onPress={() => setScanning((s) => !s)}
            />
          }
        />
      }
    >
      <CameraPreview
        scanning={scanning}
        showPoints={showPoints}
        onTogglePoints={() => setShowPoints((s) => !s)}
        result={last ? `${signName(last.sign, lang)} · ${Math.round(last.confidence * 100)}%` : undefined}
      />
      <AppText variant="caption" color={palette.ink2}>
        {t('rec.cameraNote')}
      </AppText>

      <Card style={styles.card}>
        <View style={[styles.between, row]}>
          <AppText variant="heading" accessibilityRole="header">
            {t('rec.output')}
          </AppText>
          {/* No score until a sign has actually been recognised. */}
          {last ? <StatusPill label={t('rec.confidence', { n: Math.round(last.confidence * 100) })} tone="success" /> : null}
        </View>

        {captured.length === 0 ? (
          <AppText variant="bodySm" color={palette.ink2}>
            {t('rec.placeholder')}
          </AppText>
        ) : (
          <View style={styles.output} accessibilityLiveRegion="polite">
            {lines.ur ? <AppText variant="urdu">{lines.ur}</AppText> : null}
            {lines.en ? <AppText style={styles.english}>{lines.en}</AppText> : null}
          </View>
        )}

        {captured.length > 0 ? (
          <View style={styles.group}>
            <AppText variant="label">{t('rec.stream')}</AppText>
            <View style={[styles.chips, row]}>
              {captured.map((c, i) => (
                <View key={`${c.sign.id}-${i}`} style={[styles.token, row]}>
                  <AppText variant="caption" color={palette.tealInk} style={styles.tokenText}>
                    {signName(c.sign, lang)}
                  </AppText>
                  <Pressable
                    onPress={() => setCaptured((prev) => prev.filter((_, at) => at !== i))}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={t('rec.remove', { name: signName(c.sign, lang) })}
                  >
                    <Ionicons name="close" size={15} color={palette.tealInk} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {captured.length > 0 ? (
          <View style={[styles.actions, row]}>
            <Button
              title={isSpeaking ? t('preview.stopSpeaking') : t('preview.speakAloud')}
              icon={isSpeaking ? 'stop' : 'volume-high-outline'}
              variant="ghost"
              style={styles.flex}
              onPress={onSpeak}
            />
            <Button title={t('preview.save')} icon="bookmark-outline" style={styles.flex} onPress={onSave} />
          </View>
        ) : null}
        {captured.length > 0 ? <Button title={t('preview.clear')} icon="trash-outline" variant="danger" onPress={clear} /> : null}
      </Card>

      <Card style={styles.card}>
        <AppText variant="heading" accessibilityRole="header">
          {t('rec.try')}
        </AppText>
        <AppText variant="bodySm" color={palette.ink2}>
          {scanning ? t('rec.tryHint') : t('rec.tryPaused')}
        </AppText>
        <View style={[styles.chips, row]}>
          {vocabulary.slice(0, 12).map((sign) => (
            <Chip key={sign.id} label={signName(sign, lang)} onPress={scanning ? () => perform(sign, 0.95) : undefined} />
          ))}
          <Chip
            label={t('rec.unclear')}
            tone="dashed"
            onPress={scanning ? () => perform(vocabulary[Math.floor(Math.random() * 12)], 0.62) : undefined}
          />
        </View>
      </Card>

      <RepeatSignModal
        visible={!!unclear}
        score={unclear?.confidence ?? 0}
        threshold={threshold}
        suggestions={unclear ? [unclear.sign, ...vocabulary.filter((v) => v.id !== unclear.sign.id).slice(0, 2)] : []}
        onRetry={() => setUnclear(null)}
        onSelectSuggestion={(sign) => {
          setUnclear(null);
          perform(sign, 0.95);
        }}
        onTypeInstead={() => {
          setUnclear(null);
          navigation.navigate('TextToSign');
        }}
        onDismiss={() => setUnclear(null)}
      />
    </Screen>
  );
}

const styles = themedStyles(() => ({
  content: { paddingTop: spacing.md },
  headerAction: { minHeight: 44, paddingHorizontal: spacing.md },
  card: { gap: spacing.md },
  between: { alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  output: { gap: spacing.xs },
  english: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24, color: palette.navyText },
  group: { gap: spacing.sm },
  chips: { flexWrap: 'wrap', gap: spacing.sm },
  token: {
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: palette.tealSoft,
  },
  tokenText: { fontFamily: fonts.medium },
  actions: { gap: spacing.sm },
  flex: { flex: 1 },
}));

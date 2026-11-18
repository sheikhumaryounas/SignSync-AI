import React, { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fonts, palette, radius, spacing, useDirection, themedStyles } from '../../theme';
import { RootStackParamList, SignVocabularyItem } from '../../types';
import { AppText, Button, Card, Chip, Screen, StatusPill } from '../../components/ui';
import { usePreview } from '../../context/PreviewContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useI18n } from '../../i18n';
import { HeaderBar } from '../../components/preview/HeaderBar';
import { SignRecorder } from '../../components/preview/SignRecorder';
import { RepeatSignModal } from '../../components/preview/RepeatSignModal';
import { correctSignSequence, signName, signNameEn } from '../../services/preview/aiEngine';
import { ASL_SIGNS } from '../../services/recognition/aslSigns';
import { SignGuess, SignResult } from '../../services/recognition/signApi';
import { linesFor } from '../../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'SignRecognition'>;

export default function SignRecognitionScreen({ navigation }: Props) {
  const { preferences, addSession, speakText, isSpeaking, stopSpeaking } = usePreview();
  const { notify } = useFeedback();
  const { t, lang } = useI18n();
  const { row } = useDirection();
  const openedAt = useRef(Date.now());
  const [captured, setCaptured] = useState<SignGuess[]>([]);
  // The model's other top answers for the last sign, offered as one-tap corrections.
  const [alternatives, setAlternatives] = useState<SignGuess[]>([]);
  const [unclear, setUnclear] = useState<SignGuess[] | null>(null);
  const [lastMs, setLastMs] = useState<number | null>(null);

  const signs = captured.map((c) => c.sign);
  const last = captured[captured.length - 1];
  const corrected = correctSignSequence(signs.map(signNameEn));
  const lines = linesFor(preferences.outputLanguage, corrected.english, corrected.urdu);

  // notify() follows the user's feedback settings: banner, spoken word and/or vibration.
  const accept = (guess: SignGuess, others: SignGuess[] = []) => {
    const name = signName(guess.sign, lang);
    notify({ tone: 'success', message: t('rec.recognised', { name, n: Math.round(guess.confidence * 100) }), speak: name });
    setCaptured((prev) => [...prev, guess]);
    setAlternatives(others.filter((g) => g.sign.id !== guess.sign.id));
  };

  // Swaps the last sign for one of the model's other answers; the replaced one becomes an option.
  const correctLast = (choice: SignGuess) => {
    const replaced = captured[captured.length - 1];
    setCaptured((prev) => [...prev.slice(0, -1), choice]);
    setAlternatives((prev) => [replaced, ...prev.filter((g) => g.sign.id !== choice.sign.id)]);
  };

  // An answer the server did not accept never becomes output: the signer is asked to sign again.
  const onResult = ({ guesses, processingMs, accepted }: SignResult) => {
    setLastMs(processingMs);
    if (!accepted) setUnclear(guesses);
    else accept(guesses[0], guesses.slice(1));
  };

  const clear = () => {
    setCaptured([]);
    setAlternatives([]);
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
      signConfidences: captured.map((c) => c.confidence),
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
      header={<HeaderBar title={t('home.modeSign')} onBack={navigation.goBack} />}
    >
      <SignRecorder onResult={onResult} paused={!!unclear} />
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
        {lastMs !== null && captured.length > 0 ? (
          <AppText variant="caption">{t('rec.processed', { s: (lastMs / 1000).toFixed(1) })}</AppText>
        ) : null}

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
                    onPress={() => {
                      if (i === captured.length - 1) setAlternatives([]);
                      setCaptured((prev) => prev.filter((_, at) => at !== i));
                    }}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={t('rec.remove', { name: signName(c.sign, lang) })}
                  >
                    <Ionicons name="close" size={15} color={palette.tealInk} />
                  </Pressable>
                </View>
              ))}
            </View>
            {alternatives.length > 0 ? (
              <View style={[styles.chips, row, styles.center]}>
                <AppText variant="caption">{t('rec.notRight', { name: signName(last.sign, lang) })}</AppText>
                {alternatives.map((g) => (
                  <Chip
                    key={g.sign.id}
                    label={`${signName(g.sign, lang)} · ${Math.round(g.confidence * 100)}%`}
                    onPress={() => correctLast(g)}
                    accessibilityHint={t('rec.notRightHint')}
                  />
                ))}
              </View>
            ) : null}
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
            <Button title={t('preview.save')} style={styles.flex} onPress={onSave} />
          </View>
        ) : null}
        {captured.length > 0 ? <Button title={t('preview.clear')} variant="danger" onPress={clear} /> : null}
      </Card>

      <Card style={styles.card}>
        <AppText variant="heading" accessibilityRole="header">
          {t('rec.modelTitle')}
        </AppText>
        <AppText variant="bodySm" color={palette.ink2}>
          {t('rec.modelNote')}
        </AppText>
        <View style={[styles.chips, row]}>
          {ASL_SIGNS.map((sign) => (
            <Chip key={sign.id} label={signName(sign, lang)} />
          ))}
        </View>
      </Card>

      <RepeatSignModal
        visible={!!unclear}
        suggestions={unclear?.map((g) => g.sign) ?? []}
        onRetry={() => setUnclear(null)}
        onSelectSuggestion={(sign: SignVocabularyItem) => {
          const guess = unclear?.find((g) => g.sign.id === sign.id);
          setUnclear(null);
          if (guess) accept(guess, unclear ?? []);
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
  card: { gap: spacing.md },
  between: { alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  output: { gap: spacing.xs },
  english: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24, color: palette.navyText },
  group: { gap: spacing.sm },
  chips: { flexWrap: 'wrap', gap: spacing.sm },
  center: { alignItems: 'center' },
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

import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { palette, spacing, useDirection, themedStyles } from '../../theme';
import { RootStackParamList } from '../../types';
import { AppText, Button, Card, Chip, Input, Screen, SegmentedControl } from '../../components/ui';
import { usePreview } from '../../context/PreviewContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useI18n } from '../../i18n';
import { HeaderBar } from '../../components/preview/HeaderBar';
import { SignAvatarComponent } from '../../components/preview/SignAvatarComponent';
import { SignSequenceCard } from '../../components/preview/SignSequenceCard';
import { AudioWaveformVisualizer } from '../../components/preview/AudioWaveformVisualizer';
import { mapTextToSignSequence, signNameEn } from '../../services/preview/aiEngine';
import { quickPhrases } from '../../services/preview/mockData';
import { isUrduText } from '../../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'VoiceSign'>;
type SpeechLanguage = 'ur' | 'en';

export default function VoiceSignScreen({ navigation }: Props) {
  const { preferences, addSession } = usePreview();
  const { notify } = useFeedback();
  const { t, lang } = useI18n();
  const { row } = useDirection();
  const openedAt = useRef(Date.now());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [listening, setListening] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState<SpeechLanguage>(lang);
  const [text, setText] = useState(lang === 'ur' ? quickPhrases[3].ur : quickPhrases[3].en);

  const { supportedSigns, unsupportedWords } = mapTextToSignSequence(text);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const stopListening = () => {
    if (timer.current) clearTimeout(timer.current);
    setListening(false);
  };

  // There is no real speech recognition yet: this stands in a sample phrase after a short pause.
  const startListening = () => {
    setListening(true);
    timer.current = setTimeout(() => {
      const sample = quickPhrases[Math.floor(Math.random() * quickPhrases.length)];
      setText(speechLanguage === 'ur' ? sample.ur : sample.en);
      setListening(false);
    }, 2200);
  };

  const onSave = () => {
    const input = text.trim();
    if (!input) {
      notify({ tone: 'warning', message: t('preview.nothingToSave') });
      return;
    }
    addSession({
      userId: preferences.userId,
      title: `${t('home.modeSpeak')}: ${input.slice(0, 24)}`,
      modality: 'speech_to_sign',
      inputText: input,
      outputTextUrdu: input,
      outputTextEnglish: input,
      signSequence: supportedSigns.map(signNameEn),
      averageConfidence: 1,
      duration: `${Math.max(1, Math.round((Date.now() - openedAt.current) / 1000))}s`,
      feedbackGiven: 'up',
    });
    notify({ tone: 'success', message: t('preview.saved') });
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      contentStyle={styles.content}
      header={
        <HeaderBar
          title={t('home.modeSpeak')}
          onBack={navigation.goBack}
          rightAction={<Button title={t('preview.save')} icon="bookmark-outline" variant="ghost" fullWidth={false} style={styles.save} onPress={onSave} />}
        />
      }
    >
      <Card style={styles.card}>
        <AppText variant="heading" accessibilityRole="header">
          {t('speech.title')}
        </AppText>
        <SegmentedControl<SpeechLanguage>
          accessibilityLabel={t('speech.language')}
          value={speechLanguage}
          onChange={setSpeechLanguage}
          options={[
            { value: 'ur', label: t('register.langUrdu'), urdu: true },
            { value: 'en', label: t('register.langEnglish') },
          ]}
        />

        <View style={styles.micArea}>
          <Pressable
            onPress={listening ? stopListening : startListening}
            accessibilityRole="button"
            accessibilityLabel={listening ? t('speech.stop') : t('speech.start')}
            style={({ pressed }) => [styles.mic, listening ? styles.micOn : null, pressed ? styles.pressed : null]}
          >
            <Ionicons name={listening ? 'stop' : 'mic'} size={30} color={palette.white} />
          </Pressable>
          <AppText variant="bodySm" align="center" color={palette.ink2} accessibilityLiveRegion="polite">
            {listening ? t('speech.listening') : t('speech.tap')}
          </AppText>
          {listening ? <AudioWaveformVisualizer isActive barCount={20} height={28} color={palette.tealInk} /> : null}
        </View>

        <Input
          label={t('speech.heard')}
          value={text}
          onChangeText={setText}
          urdu={isUrduText(text)}
          multiline
          numberOfLines={2}
          placeholder={t('speech.placeholder')}
        />

        <AppText variant="label">{t('preview.phrases')}</AppText>
        <View style={[styles.chips, row]}>
          {quickPhrases.map((phrase) => (
            <Chip key={phrase.label} label={t(phrase.label)} onPress={() => setText(speechLanguage === 'ur' ? phrase.ur : phrase.en)} />
          ))}
        </View>
      </Card>

      <SignAvatarComponent signs={supportedSigns} />
      <SignSequenceCard signs={supportedSigns} unsupportedWords={unsupportedWords} />
    </Screen>
  );
}

const styles = themedStyles(() => ({
  content: { paddingTop: spacing.md },
  card: { gap: spacing.md },
  micArea: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  mic: { width: 72, height: 72, borderRadius: 36, backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center' },
  micOn: { backgroundColor: palette.error },
  pressed: { opacity: 0.85 },
  chips: { flexWrap: 'wrap', gap: spacing.sm },
  save: { minHeight: 44, paddingHorizontal: spacing.md },
}));

import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { palette, radius, shadow, spacing, useDirection } from '../../theme';
import { RootStackParamList, SignVocabularyItem } from '../../types';
import { AppText, Button, Chip, IconBadge, IconButton, Input, SegmentedControl } from '../../components/ui';
import { usePreview } from '../../context/PreviewContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useI18n } from '../../i18n';
import { HeaderBar } from '../../components/preview/HeaderBar';
import { SignAvatarComponent } from '../../components/preview/SignAvatarComponent';
import { correctSignSequence, mapTextToSignSequence, signName, signNameEn } from '../../services/preview/aiEngine';
import { isUrduText, linesFor, timeLabel } from '../../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'BidirectionalChat'>;
type Side = 'signer' | 'speaker';

interface ChatTurn {
  id: string;
  side: Side;
  textUrdu: string;
  textEnglish: string;
  at: string;
}

const minutesAgo = (n: number) => new Date(Date.now() - n * 60000).toISOString();

const seedTurns = (): ChatTurn[] => [
  { id: 'seed1', side: 'signer', textUrdu: 'السلام علیکم! مجھے ڈاکٹر سے ملنا ہے۔', textEnglish: 'Assalam-o-Alaikum! I want to meet the doctor.', at: minutesAgo(3) },
  { id: 'seed2', side: 'speaker', textUrdu: 'وعلیکم السلام! ڈاکٹر صاحب کمرہ نمبر 4 میں موجود ہیں۔', textEnglish: 'Wa-Alaikum-Assalam! The doctor is in Room 4.', at: minutesAgo(2) },
  { id: 'seed3', side: 'signer', textUrdu: 'شکریہ، کیا دوا بھی وہیں ملے گی؟', textEnglish: 'Thank you. Will I get medicine there too?', at: minutesAgo(1) },
];

const SAMPLE_SPEECH = {
  ur: 'براہ کرم تشریف رکھیں، آپ کی دوا پانچ منٹ میں تیار ہو جائے گی۔',
  en: 'Please take a seat. Your medicine will be ready in five minutes.',
};

export default function BidirectionalChatScreen({ navigation }: Props) {
  const { preferences, vocabulary, addSession, speakText } = usePreview();
  const { notify } = useFeedback();
  const { t, lang } = useI18n();
  const { row, start, end, isRTL } = useDirection();
  const openedAt = useRef(Date.now());
  const scroller = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [view, setView] = useState<'chat' | 'guide'>('chat');
  const [side, setSide] = useState<Side>('signer');
  const [status, setStatus] = useState<'idle' | 'signing' | 'listening'>('idle');
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>(seedTurns);
  const [guideSigns, setGuideSigns] = useState<SignVocabularyItem[]>(() => vocabulary.slice(0, 3));

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    []
  );

  const addTurn = (turn: Omit<ChatTurn, 'id' | 'at'>) => {
    setTurns((prev) => [...prev, { ...turn, id: `turn_${Date.now()}`, at: new Date().toISOString() }]);
  };

  const sendSign = (sign: SignVocabularyItem) => {
    setStatus('signing');
    timers.current.push(
      setTimeout(() => {
        const corrected = correctSignSequence([signNameEn(sign)]);
        addTurn({ side: 'signer', textUrdu: corrected.urdu, textEnglish: corrected.english });
        speakText(preferences.outputLanguage === 'english' ? corrected.english : corrected.urdu, { auto: true });
        setStatus('idle');
      }, 500)
    );
  };

  const sendText = () => {
    const text = draft.trim();
    if (!text) return;
    addTurn({ side: 'speaker', textUrdu: text, textEnglish: text });
    const { supportedSigns } = mapTextToSignSequence(text);
    if (supportedSigns.length > 0) setGuideSigns(supportedSigns);
    setDraft('');
  };

  // There is no real speech recognition yet: the microphone stands in a sample sentence.
  const simulateSpeech = () => {
    setStatus('listening');
    timers.current.push(
      setTimeout(() => {
        addTurn({ side: 'speaker', textUrdu: SAMPLE_SPEECH.ur, textEnglish: SAMPLE_SPEECH.en });
        setGuideSigns(mapTextToSignSequence(SAMPLE_SPEECH.en).supportedSigns);
        setStatus('idle');
      }, 1800)
    );
  };

  const onSave = () => {
    const label = (s: Side) => (s === 'signer' ? t('chat.signer') : t('chat.speaker'));
    addSession({
      userId: preferences.userId,
      title: `${t('home.modeChat')} (${turns.length})`,
      modality: 'bidirectional',
      inputText: turns.map((m) => m.textEnglish).join(' / '),
      outputTextUrdu: turns.map((m) => `${label(m.side)}: ${m.textUrdu}`).join('\n'),
      outputTextEnglish: turns.map((m) => `${label(m.side)}: ${m.textEnglish}`).join('\n'),
      signSequence: guideSigns.map(signNameEn),
      averageConfidence: 1,
      duration: `${Math.max(1, Math.round((Date.now() - openedAt.current) / 1000))}s`,
      feedbackGiven: 'up',
    });
    notify({ tone: 'success', message: t('preview.saved') });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <HeaderBar
        title={t('home.modeChat')}
        onBack={navigation.goBack}
        rightAction={<Button title={t('preview.save')} icon="bookmark-outline" variant="ghost" fullWidth={false} style={styles.save} onPress={onSave} />}
      />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <View style={styles.switcher}>
          <SegmentedControl<'chat' | 'guide'>
            value={view}
            onChange={setView}
            options={[
              { value: 'chat', label: t('chat.messages', { n: turns.length }) },
              { value: 'guide', label: t('chat.guide') },
            ]}
          />
        </View>

        <ScrollView
          ref={scroller}
          style={styles.flex}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (view === 'chat') scroller.current?.scrollToEnd({ animated: true });
          }}
        >
          {view === 'guide' ? (
            <SignAvatarComponent signs={guideSigns} />
          ) : (
            turns.map((turn) => {
              const signer = turn.side === 'signer';
              const lines = linesFor(preferences.outputLanguage, turn.textEnglish, turn.textUrdu);
              const single = turn.textEnglish === turn.textUrdu;
              const ur = single ? (isUrduText(turn.textUrdu) ? turn.textUrdu : undefined) : lines.ur;
              const en = single ? (isUrduText(turn.textUrdu) ? undefined : turn.textEnglish) : lines.en;
              const mapped = mapTextToSignSequence(turn.textEnglish).supportedSigns;
              return (
                <View
                  key={turn.id}
                  style={[
                    styles.bubble,
                    signer ? styles.signerBubble : styles.speakerBubble,
                    { alignSelf: signer ? start : end },
                    signer === isRTL ? styles.tailRight : styles.tailLeft,
                  ]}
                >
                  <View style={[styles.bubbleHead, row]}>
                    <IconBadge icon={signer ? 'hand-left-outline' : 'mic-outline'} tone={signer ? 'teal' : 'navy'} size="sm" />
                    <AppText variant="caption" style={styles.flex} color={palette.ink2}>
                      {signer ? t('chat.signer') : t('chat.speaker')}
                    </AppText>
                    <AppText variant="caption" color={palette.ink2}>
                      {timeLabel(turn.at, lang)}
                    </AppText>
                  </View>
                  {ur ? <AppText variant="urdu">{ur}</AppText> : null}
                  {en ? <AppText variant="body">{en}</AppText> : null}
                  <View style={[styles.bubbleActions, row]}>
                    {signer ? (
                      <Chip label={t('preview.speakAloud')} onPress={() => speakText(ur ?? en ?? '')} />
                    ) : mapped.length > 0 ? (
                      <Chip
                        label={t('chat.showGuide')}
                        onPress={() => {
                          setGuideSigns(mapped);
                          setView('guide');
                        }}
                      />
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
          {status !== 'idle' ? (
            <AppText variant="caption" align="center" color={palette.ink2} accessibilityLiveRegion="polite">
              {status === 'signing' ? t('chat.signing') : t('chat.listening')}
            </AppText>
          ) : null}
        </ScrollView>

        <View style={styles.composer}>
          <SegmentedControl<Side>
            size="sm"
            accessibilityLabel={t('chat.composerSide')}
            value={side}
            onChange={setSide}
            options={[
              { value: 'signer', label: t('chat.signer') },
              { value: 'speaker', label: t('chat.speaker') },
            ]}
          />
          {side === 'signer' ? (
            <View style={[styles.signs, row]}>
              {vocabulary.slice(0, 6).map((sign) => (
                <Chip key={sign.id} label={signName(sign, lang)} onPress={() => sendSign(sign)} />
              ))}
              <Chip label={t('chat.openCamera')} tone="teal" onPress={() => navigation.navigate('SignRecognition')} />
            </View>
          ) : (
            <View style={[styles.inputRow, row]}>
              <View style={styles.flex}>
                <Input
                  raised
                  value={draft}
                  onChangeText={setDraft}
                  urdu={isUrduText(draft)}
                  placeholder={t('chat.placeholder')}
                  accessibilityLabel={t('chat.placeholder')}
                  returnKeyType="send"
                  onSubmitEditing={sendText}
                />
              </View>
              {draft.trim() ? (
                <IconButton icon="send" tone="outline" accessibilityLabel={t('chat.send')} onPress={sendText} />
              ) : (
                <IconButton icon="mic" tone="outline" accessibilityLabel={t('speech.start')} onPress={simulateSpeech} />
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.canvas },
  flex: { flex: 1 },
  save: { minHeight: 44, paddingHorizontal: spacing.md },
  switcher: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.md },
  bubble: { maxWidth: '90%', minWidth: '70%', borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  signerBubble: { backgroundColor: palette.surface, boxShadow: shadow.card },
  speakerBubble: { backgroundColor: palette.navySoft },
  tailLeft: { borderTopLeftRadius: 5 },
  tailRight: { borderTopRightRadius: 5 },
  bubbleHead: { alignItems: 'center', gap: spacing.sm },
  bubbleActions: {},
  composer: {
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    boxShadow: shadow.bar,
  },
  signs: { flexWrap: 'wrap', gap: spacing.sm },
  inputRow: { alignItems: 'center', gap: spacing.sm },
});

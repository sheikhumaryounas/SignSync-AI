import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme';
import { RootStackParamList } from '../../types';
import { usePreview } from '../../context/PreviewContext';
import { HeaderBar } from '../../components/preview/HeaderBar';
import { SignAvatarComponent } from '../../components/preview/SignAvatarComponent';
import { AudioWaveformVisualizer } from '../../components/preview/AudioWaveformVisualizer';
import { TouchFeedback } from '../../components/preview/TouchFeedback';
import { mapTextToSignSequence } from '../../services/preview/aiEngine';

type Props = NativeStackScreenProps<RootStackParamList, 'VoiceSign'>;

export default function VoiceSignScreen({ navigation }: Props) {
  const { preferences, addSession, theme, isDark } = usePreview();

  const [isListening, setIsListening] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState<'urdu' | 'english'>('urdu');
  const [transcribedText, setTranscribedText] = useState(
    'السلام علیکم، مجھے ڈاکٹر سے ملنا ہے اور پانی چاہیے'
  );
  const [avatarPlaying, setAvatarPlaying] = useState(true);
  const [avatarSpeed, setAvatarSpeed] = useState(preferences.avatarSpeed || 1.0);

  // Pulse animation for recording mic ring
  const pulseRing = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseRing, {
              toValue: 1.45,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseRing, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, {
              toValue: 0.1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.6,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else {
      pulseRing.setValue(1);
      pulseOpacity.setValue(0);
    }
  }, [isListening, pulseRing, pulseOpacity]);

  const { supportedSigns, unsupportedWords } = mapTextToSignSequence(transcribedText);

  const samplePhrases = [
    { label: 'Doctor & Medicine', textUrdu: 'مجھے ڈاکٹر اور دوا چاہیے', textEng: 'I need a doctor and medicine' },
    { label: 'Hospital Location', textUrdu: 'ہسپتال کا راستہ کہاں ہے؟', textEng: 'Where is the hospital located?' },
    { label: 'Food & Water', textUrdu: 'براہِ کرم مجھے کھانا اور پانی دیں', textEng: 'Please provide food and water' },
    { label: 'Daily Greeting', textUrdu: 'السلام علیکم! آپ کیسے ہیں؟', textEng: 'Assalam-o-Alaikum! How are you?' },
  ];

  const handleToggleListening = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      setTimeout(() => {
        const sample = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
        const spoken = speechLanguage === 'urdu' ? sample.textUrdu : sample.textEng;
        setTranscribedText(spoken);
        setIsListening(false);
      }, 2500);
    }
  };

  const handleSaveSession = () => {
    if (!transcribedText.trim()) {
      Alert.alert('Empty', 'Please speak or enter a message first.');
      return;
    }

    addSession({
      userId: preferences.userId,
      title: `Voice to Avatar (${speechLanguage.toUpperCase()})`,
      modality: 'speech_to_sign',
      inputText: transcribedText,
      outputTextUrdu: transcribedText,
      outputTextEnglish: transcribedText,
      signSequence: supportedSigns.map(s => s.signNameEnglish.split('/')[0].trim()),
      averageConfidence: 0.98,
      duration: '1m 15s',
      feedbackGiven: 'up',
    });

    Alert.alert(
      'Session Saved',
      'Conversation has been saved to your Communication History.',
      [
        { text: 'View History', onPress: () => navigation.navigate('Main', { screen: 'CommunicationHistory' }) },
        { text: 'OK', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <HeaderBar
        title="Speech → Sign Avatar"
        subtitle="Voice to Pakistan Sign Language"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchFeedback
            style={[styles.saveHeaderBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
            onPress={handleSaveSession}
          >
            <Ionicons name="bookmark-outline" size={15} color={isDark ? colors.brandCyan : colors.brandNavy} style={{ marginRight: 4 }} />
            <Text style={[styles.saveHeaderBtnText, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>Save</Text>
          </TouchFeedback>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 3D Sign Avatar Stage */}
        <SignAvatarComponent
          signSequence={supportedSigns}
          isPlaying={avatarPlaying}
          speed={avatarSpeed}
          onTogglePlay={() => setAvatarPlaying(!avatarPlaying)}
          onChangeSpeed={setAvatarSpeed}
        />

        {/* Voice Capture & Transcription Panel */}
        <View style={[styles.voiceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Language Toggle */}
          <View style={styles.langToggleRow}>
            <Text style={[styles.cardSectionTitle, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>Spoken Speech Input</Text>
            <View style={[styles.langPillContainer, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
              <TouchFeedback
                style={[
                  styles.langPill,
                  speechLanguage === 'urdu' && [
                    styles.langPillActive,
                    { backgroundColor: isDark ? colors.brandCyanDark : colors.brandNavy },
                  ],
                ]}
                onPress={() => setSpeechLanguage('urdu')}
              >
                <Text
                  style={[
                    styles.langPillText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                    speechLanguage === 'urdu' && styles.langPillTextActive,
                  ]}
                >
                  اردو (Urdu)
                </Text>
              </TouchFeedback>

              <TouchFeedback
                style={[
                  styles.langPill,
                  speechLanguage === 'english' && [
                    styles.langPillActive,
                    { backgroundColor: isDark ? colors.brandCyanDark : colors.brandNavy },
                  ],
                ]}
                onPress={() => setSpeechLanguage('english')}
              >
                <Text
                  style={[
                    styles.langPillText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                    speechLanguage === 'english' && styles.langPillTextActive,
                  ]}
                >
                  English
                </Text>
              </TouchFeedback>
            </View>
          </View>

          {/* Microphone Push to Speak Hero Button with Animated Rings */}
          <View style={styles.micCenterContainer}>
            <View style={styles.micRingWrapper}>
              {isListening && (
                <Animated.View
                  style={[
                    styles.pulseRing,
                    {
                      transform: [{ scale: pulseRing }],
                      opacity: pulseOpacity,
                    },
                  ]}
                />
              )}

              <TouchFeedback
                style={[
                  styles.micBigButton,
                  { backgroundColor: isDark ? colors.brandCyan : colors.brandNavy },
                  isListening && styles.micBigButtonActive,
                ]}
                onPress={handleToggleListening}
              >
                <Ionicons
                  name={isListening ? 'stop' : 'mic'}
                  size={32}
                  color={isListening ? '#FFFFFF' : isDark ? '#001A38' : '#FFFFFF'}
                />
              </TouchFeedback>
            </View>

            <Text style={[styles.micStatusText, { color: isListening ? (isDark ? '#38BDF8' : '#0284C7') : theme.textSecondary }]}>
              {isListening
                ? 'Listening to speech via Whisper AI...'
                : 'Tap microphone to speak'}
            </Text>

            {/* Audio Waveform */}
            <View style={styles.waveBox}>
              <AudioWaveformVisualizer
                isActive={isListening}
                barCount={20}
                height={32}
                color={isDark ? colors.brandCyan : colors.brandNavy}
              />
            </View>
          </View>

          {/* Transcription Input & Edit */}
          <View style={[styles.transcriptionBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
            <View style={styles.transcriptionHeaderRow}>
              <Text style={[styles.transcriptionHeader, { color: theme.textSecondary }]}>
                Transcribed Speech ({speechLanguage.toUpperCase()}):
              </Text>
              <View style={styles.whisperBadge}>
                <Text style={styles.whisperBadgeText}>Whisper-v3</Text>
              </View>
            </View>
            <TextInput
              style={[styles.transcriptionInput, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}
              value={transcribedText}
              onChangeText={setTranscribedText}
              placeholder="Speak or type a sentence..."
              placeholderTextColor="#94A3B8"
              multiline
            />
          </View>

          {/* Quick Phrases */}
          <Text style={[styles.quickPhrasesTitle, { color: theme.textSecondary }]}>Quick Essential Phrases:</Text>
          <View style={styles.phrasesRow}>
            {samplePhrases.map((phrase, idx) => (
              <TouchFeedback
                key={idx}
                style={[styles.phraseChip, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                onPress={() =>
                  setTranscribedText(
                    speechLanguage === 'urdu' ? phrase.textUrdu : phrase.textEng
                  )
                }
              >
                <Ionicons name="chatbubble-outline" size={13} color={isDark ? colors.brandCyan : colors.brandNavy} style={{ marginRight: 4 }} />
                <Text style={[styles.phraseChipText, { color: isDark ? '#FFFFFF' : colors.brandNavy }]} numberOfLines={1}>{phrase.label}</Text>
              </TouchFeedback>
            ))}
          </View>
        </View>

        {/* Sign Breakdown Info Card */}
        <View style={[styles.breakdownCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.breakdownTitle, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>PSL Sequence Breakdown</Text>
          <Text style={[styles.breakdownSubtitle, { color: theme.textSecondary }]}>
            {supportedSigns.length} mapped sign gestures for 3D avatar
          </Text>

          <View style={styles.mappedSignsList}>
            {supportedSigns.map((sign, idx) => (
              <View key={sign.id + idx} style={[styles.mappedPill, { backgroundColor: isDark ? '#0A2540' : '#E0F7FA', borderColor: isDark ? '#00E5FF' : 'rgba(0, 180, 216, 0.3)' }]}>
                <Ionicons name="hand-left-outline" size={13} color={isDark ? '#00E5FF' : colors.brandCyanDark} style={{ marginRight: 4 }} />
                <Text style={[styles.mappedPillEng, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>
                  {sign.signNameEnglish.split('/')[0].trim()}
                </Text>
                <Text style={[styles.mappedPillUrdu, { color: isDark ? '#38BDF8' : colors.brandCyanDark }]}>{sign.signNameUrdu}</Text>
              </View>
            ))}
          </View>

          {unsupportedWords.length > 0 && (
            <View style={[styles.unsupportedAlert, isDark && { backgroundColor: '#3B2F08', borderColor: '#785A0E' }]}>
              <Ionicons name="alert-circle-outline" size={16} color={isDark ? '#FBBF24' : '#D97706'} style={{ marginRight: 6 }} />
              <Text style={[styles.unsupportedText, isDark && { color: '#FDE68A' }]}>
                Words requiring fingerspelling: {unsupportedWords.join(', ')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  saveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveHeaderBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brandNavy,
  },
  voiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginTop: 14,
    borderWidth: 1.3,
    borderColor: '#E2E8F0',
    shadowColor: '#002855',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  langToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.brandNavy,
  },
  langPillContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
  },
  langPillActive: {
    backgroundColor: colors.brandNavy,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  langPillTextActive: {
    color: '#FFFFFF',
  },
  micCenterContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  micRingWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    height: 90,
  },
  pulseRing: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.brandCyan,
  },
  micBigButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brandNavy,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.brandNavy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  micBigButtonActive: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  micStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 10,
  },
  waveBox: {
    marginTop: 10,
    height: 36,
    justifyContent: 'center',
  },
  transcriptionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  transcriptionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  transcriptionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  whisperBadge: {
    backgroundColor: '#E0F7FA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  whisperBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.brandCyanDark,
  },
  transcriptionInput: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.brandNavy,
    lineHeight: 22,
    minHeight: 50,
  },
  quickPhrasesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  phrasesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  phraseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  phraseChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brandNavy,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginTop: 14,
    borderWidth: 1.3,
    borderColor: '#E2E8F0',
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.brandNavy,
  },
  breakdownSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  mappedSignsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  mappedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F7FA',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.3)',
    gap: 4,
  },
  mappedPillEng: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brandNavy,
  },
  mappedPillUrdu: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brandCyanDark,
  },
  unsupportedAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  unsupportedText: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
    lineHeight: 15,
  },
});
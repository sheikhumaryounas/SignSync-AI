import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme';
import { RootStackParamList } from '../../types';
import { usePreview } from '../../context/PreviewContext';
import { HeaderBar } from '../../components/preview/HeaderBar';
import { SignAvatarComponent } from '../../components/preview/SignAvatarComponent';
import { TouchFeedback } from '../../components/preview/TouchFeedback';
import { mapTextToSignSequence } from '../../services/preview/aiEngine';

type Props = NativeStackScreenProps<RootStackParamList, 'TextToSign'>;

export default function TextToSignScreen({ navigation }: Props) {
  const { preferences, addSession, theme, isDark } = usePreview();

  const [inputText, setInputText] = useState('السلام علیکم، آپ کا کیا حال ہے؟');
  const [avatarPlaying, setAvatarPlaying] = useState(true);
  const [avatarSpeed, setAvatarSpeed] = useState(preferences.avatarSpeed || 1.0);

  const { supportedSigns, unsupportedWords } = mapTextToSignSequence(inputText);

  const quickPhrases = [
    { label: 'Greetings', textUrdu: 'السلام علیکم! آپ کا کیا حال ہے؟', textEng: 'Assalam-o-Alaikum! How are you?' },
    { label: 'Hospital Location', textUrdu: 'ہسپتال کا راستہ کہاں ہے؟', textEng: 'Where is the hospital located?' },
    { label: 'Drinking Water', textUrdu: 'براہِ کرم پینے کا صاف پانی دیں', textEng: 'Please provide clean drinking water' },
    { label: 'Need Doctor', textUrdu: 'مجھے فوری ڈاکٹر کی ضرورت ہے', textEng: 'I urgently need a doctor' },
    { label: 'Help Please', textUrdu: 'کیا آپ میری مدد کر سکتے ہیں؟', textEng: 'Can you please help me?' },
  ];

  const handleSaveSession = () => {
    if (!inputText.trim()) {
      Alert.alert('Empty', 'Please enter some text first.');
      return;
    }

    addSession({
      userId: preferences.userId,
      title: `Text to Sign (${inputText.slice(0, 15)}...)`,
      modality: 'text_to_sign',
      inputText: inputText,
      outputTextUrdu: inputText,
      outputTextEnglish: inputText,
      signSequence: supportedSigns.map(s => s.signNameEnglish.split('/')[0].trim()),
      averageConfidence: 1.0,
      duration: '45s',
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
        title="Text → Sign Avatar"
        subtitle="Pakistan Sign Language Generator"
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
        {/* 3D Sign Avatar Visualizer */}
        <SignAvatarComponent
          signSequence={supportedSigns}
          isPlaying={avatarPlaying}
          speed={avatarSpeed}
          onTogglePlay={() => setAvatarPlaying(!avatarPlaying)}
          onChangeSpeed={setAvatarSpeed}
        />

        {/* Text Input Panel */}
        <View style={[styles.inputCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardTopRow}>
            <Text style={[styles.cardHeading, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>Type Urdu or English Text:</Text>
            {inputText.length > 0 && (
              <TouchFeedback onPress={() => setInputText('')}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchFeedback>
            )}
          </View>

          <TextInput
            style={[styles.textInputBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, color: isDark ? '#FFFFFF' : colors.brandNavy }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type any sentence in Urdu or English..."
            placeholderTextColor="#94A3B8"
            multiline
          />

          <View style={styles.metaRow}>
            <Text style={[styles.metaSignCount, { color: theme.textSecondary }]}>
              {supportedSigns.length} signs mapped • {unsupportedWords.length} custom words
            </Text>
          </View>

          {/* Quick Starter Phrase Chips */}
          <Text style={[styles.quickPhrasesTitle, { color: theme.textSecondary }]}>Essential PSL Phrases:</Text>
          <View style={styles.chipsRow}>
            {quickPhrases.map((phrase, idx) => (
              <TouchFeedback
                key={idx}
                style={[styles.phraseChip, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                onPress={() => setInputText(phrase.textUrdu)}
              >
                <Ionicons name="chatbubble-outline" size={13} color={isDark ? colors.brandCyan : colors.brandNavy} style={{ marginRight: 4 }} />
                <Text style={[styles.phraseChipText, { color: isDark ? '#FFFFFF' : colors.brandNavy }]} numberOfLines={1}>{phrase.label}</Text>
              </TouchFeedback>
            ))}
          </View>
        </View>

        {/* Mapped Gesture Timeline */}
        <View style={[styles.sequenceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sequenceTitle, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>Generated Gesture Sequence</Text>
          <Text style={[styles.sequenceSubtitle, { color: theme.textSecondary }]}>
            Avatar performs each sign in chronological order
          </Text>

          <View style={styles.signsList}>
            {supportedSigns.map((sign, idx) => (
              <View key={sign.id + idx} style={[styles.signStepPill, { backgroundColor: isDark ? '#08253A' : '#E0F7FA', borderColor: isDark ? '#00E5FF' : 'rgba(0, 180, 216, 0.3)' }]}>
                <View style={[styles.stepNumCircle, { backgroundColor: isDark ? colors.brandCyan : colors.brandNavy }]}>
                  <Text style={[styles.stepNumText, { color: isDark ? '#001A38' : '#FFFFFF' }]}>{idx + 1}</Text>
                </View>
                <Ionicons name="hand-left-outline" size={13} color={isDark ? '#00E5FF' : colors.brandCyanDark} style={{ marginRight: 4 }} />
                <Text style={[styles.signStepEng, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>
                  {sign.signNameEnglish.split('/')[0].trim()}
                </Text>
                <Text style={[styles.signStepUrdu, { color: isDark ? '#38BDF8' : colors.brandCyanDark }]}>({sign.signNameUrdu})</Text>
              </View>
            ))}
          </View>

          {unsupportedWords.length > 0 && (
            <View style={[styles.alertBox, isDark && { backgroundColor: '#0B253F', borderColor: '#00E5FF' }]}>
              <Ionicons name="information-circle-outline" size={16} color={isDark ? '#00E5FF' : '#00839E'} style={{ marginRight: 6 }} />
              <Text style={[styles.alertText, { color: isDark ? '#E2E8F0' : colors.brandNavyDark }]}>
                Fingerspelling will be used for: {unsupportedWords.join(', ')}
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
  inputCard: {
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
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.brandNavy,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  textInputBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    fontWeight: '600',
    color: colors.brandNavy,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 65,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  metaSignCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  quickPhrasesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  chipsRow: {
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
  sequenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginTop: 14,
    borderWidth: 1.3,
    borderColor: '#E2E8F0',
  },
  sequenceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.brandNavy,
  },
  sequenceSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  signsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  signStepPill: {
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
  stepNumCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.brandNavy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  signStepEng: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brandNavy,
  },
  signStepUrdu: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brandCyanDark,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F7FA',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.3)',
  },
  alertText: {
    fontSize: 11,
    color: colors.brandNavyDark,
    flex: 1,
    lineHeight: 15,
  },
});

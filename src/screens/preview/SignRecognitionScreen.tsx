import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme';
import { RootStackParamList, SignVocabularyItem } from '../../types';
import { usePreview } from '../../context/PreviewContext';
import { HeaderBar } from '../../components/preview/HeaderBar';
import { MediaPipeMeshOverlay } from '../../components/preview/MediaPipeMeshOverlay';
import { RepeatSignModal } from '../../components/preview/RepeatSignModal';
import { AudioWaveformVisualizer } from '../../components/preview/AudioWaveformVisualizer';
import { TouchFeedback } from '../../components/preview/TouchFeedback';
import { recognizeSignLandmarks, correctSignSequence } from '../../services/preview/aiEngine';

type Props = NativeStackScreenProps<RootStackParamList, 'SignRecognition'>;

export default function SignRecognitionScreen({ navigation, route }: Props) {
  const {
    preferences,
    vocabulary,
    addSession,
    speakText,
    isSpeaking,
    stopSpeaking,
    theme,
    isDark,
  } = usePreview();

  const [isScanning, setIsScanning] = useState(true);
  const [showMesh, setShowMesh] = useState(preferences.visualFeedback);
  const [currentRecognizedSign, setCurrentRecognizedSign] = useState<SignVocabularyItem | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState<number>(0.96);
  const [signSequence, setSignSequence] = useState<SignVocabularyItem[]>([]);
  const [showSignTray, setShowSignTray] = useState(false);

  // Low confidence recovery modal
  const [repeatModalVisible, setRepeatModalVisible] = useState(false);
  const [lastLowScore, setLastLowScore] = useState(0.62);

  useEffect(() => {
    if (route.params?.targetSignId) {
      const found = vocabulary.find(v => v.id === route.params?.targetSignId);
      if (found) {
        handlePerformSign(found, 0.96);
      }
    }
  }, [route.params]);

  const handlePerformSign = (sign: SignVocabularyItem, forcedConfidence?: number) => {
    const res = recognizeSignLandmarks(sign, forcedConfidence);
    setCurrentRecognizedSign(res.sign);
    setCurrentConfidence(res.confidence);

    if (res.confidence < preferences.confidenceThreshold) {
      setLastLowScore(res.confidence);
      setRepeatModalVisible(true);
      return;
    }

    setSignSequence(prev => [...prev, res.sign]);

    if (preferences.audioFeedback && signSequence.length === 0) {
      speakText(res.sign.signNameUrdu);
    }
  };

  const tokensList = signSequence.map(s => s.signNameEnglish.split('/')[0].trim());
  const correctedResult = correctSignSequence(tokensList, preferences.outputLanguage);

  const handleSaveSession = () => {
    if (signSequence.length === 0) {
      Alert.alert('Empty Translation', 'Please capture at least one sign before saving.');
      return;
    }

    addSession({
      userId: preferences.userId,
      title: `Sign Translation (${tokensList.slice(0, 2).join(', ')})`,
      modality: 'sign_to_text',
      inputText: `Signs: [${tokensList.join('] [')}]`,
      outputTextUrdu: correctedResult.urdu,
      outputTextEnglish: correctedResult.english,
      signSequence: tokensList,
      averageConfidence: currentConfidence,
      duration: `${Math.max(1, Math.floor(signSequence.length * 20))}s`,
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

  const handleClear = () => {
    setSignSequence([]);
    setCurrentRecognizedSign(null);
    stopSpeaking();
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      const textToRead = preferences.outputLanguage === 'english'
        ? correctedResult.english
        : correctedResult.urdu;
      speakText(textToRead || 'کوئی اشارہ موجود نہیں۔');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <HeaderBar
        title="Sign Recognition"
        subtitle="Pakistan Sign Language Camera"
        showLiveBadge={isScanning}
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchFeedback
            style={[styles.headerBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
            onPress={() => setIsScanning(!isScanning)}
          >
            <Ionicons
              name={isScanning ? 'pause-outline' : 'play-outline'}
              size={16}
              color={isDark ? colors.brandCyan : colors.brandNavy}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.headerBtnText, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>
              {isScanning ? 'Pause' : 'Resume'}
            </Text>
          </TouchFeedback>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Camera Viewfinder with MediaPipe HUD */}
        <MediaPipeMeshOverlay
          isScanning={isScanning}
          showLandmarks={showMesh}
          onToggleLandmarks={() => setShowMesh(!showMesh)}
          detectedSignName={currentRecognizedSign?.signNameEnglish.split('/')[0].trim()}
          confidence={currentConfidence}
        />

        {/* Translation Card */}
        <View style={[styles.translationCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.accuracyTag, { backgroundColor: theme.surfaceSecondary }]}>
              <View
                style={[
                  styles.accuracyDot,
                  {
                    backgroundColor:
                      currentConfidence >= 0.85
                        ? '#00C896'
                        : currentConfidence >= 0.7
                        ? '#F59E0B'
                        : '#EF4444',
                  },
                ]}
              />
              <Text style={[styles.accuracyText, { color: isDark ? '#E2E8F0' : '#475569' }]}>
                {Math.round(currentConfidence * 100)}% Confidence
              </Text>
            </View>

            {signSequence.length > 0 && (
              <TouchFeedback onPress={handleClear} style={styles.clearBtn}>
                <Ionicons name="trash-outline" size={13} color="#EF4444" style={{ marginRight: 3 }} />
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchFeedback>
            )}
          </View>

          {/* Dynamic Language-Based Translation Output */}
          {preferences.outputLanguage === 'urdu' ? (
            <View style={styles.langBlock}>
              <View style={[styles.langPillBadge, { backgroundColor: isDark ? '#08253A' : '#E0F7FA' }]}>
                <Text style={[styles.langPillBadgeText, { color: isDark ? '#00E5FF' : colors.brandCyanDark }]}>اردو ترجمہ (URDU)</Text>
              </View>
              <Text style={[styles.outputUrduText, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>
                {correctedResult.urdu || 'اشارہ کیمرے کے سامنے ادا کریں...'}
              </Text>
            </View>
          ) : preferences.outputLanguage === 'english' ? (
            <View style={styles.langBlock}>
              <View style={[styles.langPillBadge, { backgroundColor: isDark ? '#08253A' : '#E0F7FA' }]}>
                <Text style={[styles.langPillBadgeText, { color: isDark ? '#00E5FF' : colors.brandCyanDark }]}>ENGLISH TRANSLATION</Text>
              </View>
              <Text style={[styles.outputEngText, { color: isDark ? '#FFFFFF' : colors.brandNavyDark }]}>
                {correctedResult.english || 'Perform a PSL gesture in front of camera...'}
              </Text>
            </View>
          ) : (
            <View style={styles.langBlock}>
              <View style={[styles.langPillBadge, { backgroundColor: isDark ? '#08253A' : '#E0F7FA' }]}>
                <Text style={[styles.langPillBadgeText, { color: isDark ? '#00E5FF' : colors.brandCyanDark }]}>BILINGUAL (اردو + ENGLISH)</Text>
              </View>
              <Text style={[styles.outputUrduText, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>
                {correctedResult.urdu || 'اشارہ کیمرے کے سامنے ادا کریں...'}
              </Text>
              <Text style={[styles.outputEngText, { color: isDark ? '#94A3B8' : colors.brandNavyDark }]}>
                {correctedResult.english || 'Perform a PSL gesture in front of camera...'}
              </Text>
            </View>
          )}

          {/* Accumulated Token Stream */}
          {signSequence.length > 0 && (
            <View style={[styles.tokensContainer, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
              <Text style={[styles.tokensHeader, { color: theme.textSecondary }]}>Recognized Gesture Stream:</Text>
              <View style={styles.tokensRow}>
                {signSequence.map((sign, idx) => (
                  <View key={sign.id + idx} style={[styles.tokenPill, { backgroundColor: isDark ? '#0B253F' : '#E0F7FA', borderColor: isDark ? '#00E5FF' : 'rgba(0, 180, 216, 0.3)' }]}>
                    <Ionicons name="hand-left-outline" size={12} color={isDark ? '#00E5FF' : colors.brandNavy} style={{ marginRight: 4 }} />
                    <Text style={[styles.tokenText, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>
                      {sign.signNameEnglish.split('/')[0].trim()}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setSignSequence(prev => prev.filter((_, i) => i !== idx))
                      }
                      style={{ marginLeft: 4 }}
                    >
                      <Ionicons name="close-circle" size={14} color={isDark ? '#38BDF8' : '#94A3B8'} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Actions & TTS Bar */}
          <View style={styles.actionRow}>
            <TouchFeedback
              style={[
                styles.speakButton,
                { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                isSpeaking && styles.speakButtonActive,
              ]}
              onPress={handleSpeak}
            >
              <Ionicons
                name={isSpeaking ? 'stop' : 'volume-high'}
                size={16}
                color={isSpeaking ? '#EF4444' : isDark ? colors.brandCyan : colors.brandNavy}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.speakButtonText, { color: isDark ? '#FFFFFF' : colors.brandNavy }, isSpeaking && { color: '#EF4444' }]}>
                {isSpeaking ? 'Stop TTS' : 'Speak Aloud (TTS)'}
              </Text>
            </TouchFeedback>

            <View style={styles.waveWrapper}>
              <AudioWaveformVisualizer
                isActive={isSpeaking}
                barCount={8}
                height={22}
                color={isDark ? colors.brandCyan : colors.brandNavy}
              />
            </View>

            <TouchFeedback
              style={[styles.saveButton, { backgroundColor: isDark ? colors.brandCyanDark : colors.brandNavy }]}
              onPress={handleSaveSession}
            >
              <Ionicons name="bookmark-outline" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchFeedback>
          </View>
        </View>

        {/* PSL Sign Practice / Test Tray Accordion */}
        <View style={[styles.practiceTray, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchFeedback
            style={styles.trayHeader}
            onPress={() => setShowSignTray(!showSignTray)}
          >
            <View style={styles.trayHeaderLeft}>
              <Text style={[styles.trayTitle, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>Quick PSL Gestures Library</Text>
              <Text style={[styles.traySubtitle, { color: theme.textSecondary }]}>
                {showSignTray ? 'Tap to collapse gestures' : 'Tap to test & practice gestures'}
              </Text>
            </View>
            <Ionicons
              name={showSignTray ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={isDark ? colors.brandCyan : colors.brandNavy}
            />
          </TouchFeedback>

          {showSignTray && (
            <View style={styles.trayBody}>
              <View style={styles.signsGrid}>
                {vocabulary.slice(0, 12).map(item => (
                  <TouchFeedback
                    key={item.id}
                    style={[styles.signButton, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                    onPress={() => handlePerformSign(item, 0.95)}
                  >
                    <Ionicons name="hand-left-outline" size={16} color={isDark ? colors.brandCyan : colors.brandNavy} style={{ marginBottom: 2 }} />
                    <Text style={[styles.signButtonLabel, { color: isDark ? '#FFFFFF' : colors.brandNavy }]} numberOfLines={1}>
                      {item.signNameEnglish.split('/')[0].trim()}
                    </Text>
                  </TouchFeedback>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Low-Confidence Recovery Bottom Sheet Modal */}
      <RepeatSignModal
        visible={repeatModalVisible}
        score={lastLowScore}
        threshold={preferences.confidenceThreshold}
        suggestedSigns={vocabulary.slice(0, 3)}
        onRetry={() => {
          setRepeatModalVisible(false);
          handlePerformSign(vocabulary[0], 0.95);
        }}
        onSelectSuggestion={sign => {
          setRepeatModalVisible(false);
          handlePerformSign(sign, 0.95);
        }}
        onSwitchToTyping={() => {
          setRepeatModalVisible(false);
          navigation.navigate('TextToSign');
        }}
        onDismiss={() => setRepeatModalVisible(false)}
      />
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
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandNavy,
  },
  translationCard: {
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accuracyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  accuracyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  accuracyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  langBlock: {
    marginBottom: 14,
  },
  langPillBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F7FA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  langPillBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.brandCyanDark,
    letterSpacing: 0.5,
  },
  outputUrduLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  outputUrduText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.brandNavy,
    textAlign: 'right',
    marginBottom: 14,
    lineHeight: 30,
  },
  outputEngLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  outputEngText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.brandNavyDark,
    lineHeight: 22,
    marginBottom: 14,
  },
  tokensContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tokensHeader: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  tokensRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tokenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F7FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.3)',
  },
  tokenText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brandNavy,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  speakButton: {
    flex: 1.4,
    backgroundColor: '#F1F5F9',
    minHeight: 40,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  speakButtonActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  speakButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brandNavy,
  },
  waveWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  saveButton: {
    flex: 0.9,
    backgroundColor: colors.brandNavy,
    minHeight: 40,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  practiceTray: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginTop: 14,
    borderWidth: 1.3,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  trayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  trayHeaderLeft: {
    flex: 1,
  },
  trayTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.brandNavy,
  },
  traySubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  trayBody: {
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  signsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  signButton: {
    width: '31%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  signButtonLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.brandNavy,
    textAlign: 'center',
  },
});
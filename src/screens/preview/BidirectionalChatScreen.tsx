import React, { useState } from 'react';
import {
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
import { RootStackParamList, SignVocabularyItem } from '../../types';
import { usePreview } from '../../context/PreviewContext';
import { HeaderBar } from '../../components/preview/HeaderBar';
import { SignAvatarComponent } from '../../components/preview/SignAvatarComponent';
import { AudioWaveformVisualizer } from '../../components/preview/AudioWaveformVisualizer';
import { TouchFeedback } from '../../components/preview/TouchFeedback';
import { mapTextToSignSequence, correctSignSequence } from '../../services/preview/aiEngine';

type Props = NativeStackScreenProps<RootStackParamList, 'BidirectionalChat'>;

interface ChatTurn {
  id: string;
  sender: 'deaf' | 'hearing';
  textUrdu: string;
  textEnglish: string;
  timestamp: string;
}

export default function BidirectionalChatScreen({ navigation }: Props) {
  const { preferences, vocabulary, addSession, speakText, theme, isDark } = usePreview();

  const [activeView, setActiveView] = useState<'chat' | 'avatar'>('chat');
  const [isMicActive, setIsMicActive] = useState(false);
  const [isDeafTyping, setIsDeafTyping] = useState(false);
  const [hearingText, setHearingText] = useState('');
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      id: 'msg_1',
      sender: 'deaf',
      textUrdu: 'السلام علیکم! مجھے ڈاکٹر سے ملنا ہے۔',
      textEnglish: 'Assalam-o-Alaikum! I want to meet the doctor.',
      timestamp: '11:40 AM',
    },
    {
      id: 'msg_2',
      sender: 'hearing',
      textUrdu: 'وعلیکم السلام! ڈاکٹر صاحب کمرہ نمبر 4 میں موجود ہیں۔',
      textEnglish: 'Wa-Alaikum-Assalam! The doctor is present in Room 4.',
      timestamp: '11:41 AM',
    },
    {
      id: 'msg_3',
      sender: 'deaf',
      textUrdu: 'شکریہ، کیا دوا بھی وہیں ملے گی؟',
      textEnglish: 'Thank you, will I get medicine there too?',
      timestamp: '11:42 AM',
    },
  ]);

  const [currentAvatarSigns, setCurrentAvatarSigns] = useState<SignVocabularyItem[]>(
    vocabulary.slice(0, 3)
  );

  const handleSendDeafSign = (sign: SignVocabularyItem) => {
    setIsDeafTyping(true);
    setTimeout(() => {
      setIsDeafTyping(false);
      const tokens = [sign.signNameEnglish.split('/')[0].trim()];
      const corrected = correctSignSequence(tokens, 'bilingual');

      const newMsg: ChatTurn = {
        id: `msg_${Date.now()}`,
        sender: 'deaf',
        textUrdu: corrected.urdu,
        textEnglish: corrected.english,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, newMsg]);

      if (preferences.audioFeedback) {
        speakText(corrected.urdu);
      }
    }, 600);
  };

  const handleSendHearingMessage = (customText?: string) => {
    const textToSend = customText || hearingText;
    if (!textToSend.trim()) return;

    const { supportedSigns } = mapTextToSignSequence(textToSend);
    if (supportedSigns.length > 0) {
      setCurrentAvatarSigns(supportedSigns);
    }

    const newMsg: ChatTurn = {
      id: `msg_${Date.now()}`,
      sender: 'hearing',
      textUrdu: textToSend,
      textEnglish: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newMsg]);
    setHearingText('');
  };

  const handleToggleMic = () => {
    if (isMicActive) {
      setIsMicActive(false);
    } else {
      setIsMicActive(true);
      setTimeout(() => {
        setIsMicActive(false);
        handleSendHearingMessage('برائے مہربانی یہاں تشریف رکھیں، دوا پانچ منٹ میں تیار ہو جائے گی۔');
      }, 2200);
    }
  };

  const handleSaveConversation = () => {
    addSession({
      userId: preferences.userId,
      title: `2-Way Live Talk (${messages.length} exchanges)`,
      modality: 'bidirectional',
      inputText: `Transcript: ${messages.length} messages`,
      outputTextUrdu: messages.map(m => `[${m.sender === 'deaf' ? 'Deaf' : 'Hearing'}]: ${m.textUrdu}`).join('\n'),
      outputTextEnglish: messages.map(m => `[${m.sender === 'deaf' ? 'Deaf' : 'Hearing'}]: ${m.textEnglish}`).join('\n'),
      signSequence: currentAvatarSigns.map(s => s.signNameEnglish.split('/')[0].trim()),
      averageConfidence: 0.97,
      duration: '3m 20s',
      feedbackGiven: 'up',
    });

    Alert.alert('Session Saved', 'Conversation recorded in Communication History.', [
      { text: 'View History', onPress: () => navigation.navigate('Main', { screen: 'CommunicationHistory' }) },
      { text: 'OK', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <HeaderBar
        title="2-Way Live Conversation"
        subtitle="Deaf ↔ Hearing Real-Time Bridge"
        showLiveBadge
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchFeedback
            style={[styles.saveHeaderBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
            onPress={handleSaveConversation}
          >
            <Ionicons name="bookmark-outline" size={15} color={isDark ? colors.brandCyan : colors.brandNavy} style={{ marginRight: 4 }} />
            <Text style={[styles.saveHeaderBtnText, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>Save</Text>
          </TouchFeedback>
        }
      />

      {/* Segmented View Switcher */}
      <View style={[styles.segmentBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchFeedback
          style={[styles.segmentBtn, activeView === 'chat' && [styles.segmentBtnActive, { backgroundColor: theme.surfaceSecondary }]]}
          onPress={() => setActiveView('chat')}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={16}
            color={activeView === 'chat' ? (isDark ? colors.brandCyan : colors.brandNavy) : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.segmentBtnText, activeView === 'chat' && [styles.segmentBtnTextActive, { color: isDark ? '#FFFFFF' : colors.brandNavy }]]}>
            Live Dialogue ({messages.length})
          </Text>
        </TouchFeedback>

        <TouchFeedback
          style={[styles.segmentBtn, activeView === 'avatar' && [styles.segmentBtnActive, { backgroundColor: theme.surfaceSecondary }]]}
          onPress={() => setActiveView('avatar')}
        >
          <Ionicons
            name="body-outline"
            size={16}
            color={activeView === 'avatar' ? (isDark ? colors.brandCyan : colors.brandNavy) : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.segmentBtnText, activeView === 'avatar' && [styles.segmentBtnTextActive, { color: isDark ? '#FFFFFF' : colors.brandNavy }]]}>
            3D Sign Avatar
          </Text>
        </TouchFeedback>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeView === 'avatar' && (
          <View style={styles.avatarSection}>
            <SignAvatarComponent signSequence={currentAvatarSigns} isPlaying speed={1.0} />
          </View>
        )}

        {/* Live Active Status Banner */}
        <View style={[styles.liveStatusCard, { backgroundColor: isDark ? '#081D33' : '#F0F9FF', borderColor: theme.border }]}>
          <View style={styles.pulseLiveDot} />
          <Text style={[styles.liveStatusText, { color: isDark ? '#38BDF8' : '#0369A1' }]}>
            {isMicActive
              ? 'Hearing user is speaking aloud (Whisper AI processing)...'
              : isDeafTyping
              ? 'Deaf user is signing in PSL...'
              : '2-Way Bridge Active • Instant PSL ↔ Urdu translation ready'}
          </Text>
        </View>

        {/* Chat Stream */}
        <View style={styles.chatList}>
          {messages.map(item => {
            const isDeaf = item.sender === 'deaf';
            return (
              <View
                key={item.id}
                style={[
                  styles.bubbleWrapper,
                  isDeaf ? styles.bubbleWrapperDeaf : styles.bubbleWrapperHearing,
                ]}
              >
                <View
                  style={[
                    styles.chatBubble,
                    isDeaf
                      ? [
                          styles.chatBubbleDeaf,
                          {
                            backgroundColor: isDark ? '#0A2540' : '#FFFFFF',
                            borderColor: isDark ? '#00E5FF' : '#E2E8F0',
                          },
                        ]
                      : [
                          styles.chatBubbleHearing,
                          {
                            backgroundColor: isDark ? '#142A47' : '#EDF4FC',
                            borderColor: isDark ? '#234771' : '#CBD5E1',
                          },
                        ],
                  ]}
                >
                  <View style={styles.bubbleHeader}>
                    <View style={styles.senderPillRow}>
                      <Ionicons
                        name={isDeaf ? 'hand-left-outline' : 'mic-outline'}
                        size={12}
                        color={isDeaf ? (isDark ? '#00E5FF' : '#4F46E5') : (isDark ? '#34D399' : '#059669')}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.senderPill,
                          isDeaf
                            ? [styles.senderDeaf, isDark && { color: '#00E5FF' }]
                            : [styles.senderHearing, isDark && { color: '#34D399' }],
                        ]}
                      >
                        {isDeaf ? 'Deaf User (PSL Sign)' : 'Hearing User (Voice)'}
                      </Text>
                    </View>
                    <Text style={[styles.bubbleTime, { color: theme.textSecondary }]}>{item.timestamp}</Text>
                  </View>

                  <Text
                    style={[
                      styles.urduMessageText,
                      isDeaf
                        ? [styles.urduMessageDeaf, isDark && { color: '#FFFFFF' }]
                        : [styles.urduMessageHearing, isDark && { color: '#FFFFFF' }],
                    ]}
                  >
                    {item.textUrdu}
                  </Text>

                  {item.textEnglish !== item.textUrdu && (
                    <Text style={[styles.engMessageText, { color: theme.textSecondary }]}>{item.textEnglish}</Text>
                  )}

                  <View style={styles.bubbleActions}>
                    {isDeaf ? (
                      <TouchFeedback
                        style={[styles.actionPill, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                        onPress={() => speakText(item.textUrdu)}
                      >
                        <Ionicons name="volume-high" size={13} color={isDark ? colors.brandCyan : colors.brandNavy} style={{ marginRight: 4 }} />
                        <Text style={[styles.actionPillText, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>Speak Aloud</Text>
                      </TouchFeedback>
                    ) : (
                      <TouchFeedback
                        style={[styles.actionPill, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                        onPress={() => {
                          const { supportedSigns } = mapTextToSignSequence(item.textUrdu);
                          if (supportedSigns.length > 0) {
                            setCurrentAvatarSigns(supportedSigns);
                            setActiveView('avatar');
                          }
                        }}
                      >
                        <Ionicons name="play-outline" size={13} color={isDark ? colors.brandCyan : colors.brandCyanDark} style={{ marginRight: 4 }} />
                        <Text style={[styles.actionPillText, { color: isDark ? colors.brandCyan : colors.brandCyanDark }]}>
                          Play on Avatar
                        </Text>
                      </TouchFeedback>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Deaf User Quick Signs Input Tray */}
        <View style={[styles.inputSectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="hand-left-outline" size={16} color={isDark ? colors.brandCyan : colors.brandNavy} style={{ marginRight: 6 }} />
              <Text style={[styles.sectionHeading, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>Deaf Side • Quick PSL Gestures</Text>
            </View>
            <TouchFeedback onPress={() => navigation.navigate('SignRecognition')}>
              <Text style={[styles.camLinkText, { color: isDark ? colors.brandCyan : colors.brandCyanDark }]}>Open Camera →</Text>
            </TouchFeedback>
          </View>

          <View style={styles.quickSignsGrid}>
            {vocabulary.slice(0, 8).map(sign => (
              <TouchFeedback
                key={sign.id}
                style={[styles.quickSignBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                onPress={() => handleSendDeafSign(sign)}
              >
                <Ionicons name="hand-left-outline" size={13} color={isDark ? colors.brandCyan : colors.brandNavy} style={{ marginRight: 4 }} />
                <Text style={[styles.quickSignText, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>
                  {sign.signNameEnglish.split('/')[0].trim()}
                </Text>
              </TouchFeedback>
            ))}
          </View>
        </View>

        {/* Hearing User Voice & Text Input */}
        <View style={[styles.inputSectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="mic-outline" size={16} color={isDark ? colors.brandCyan : colors.brandNavy} style={{ marginRight: 6 }} />
            <Text style={[styles.sectionHeading, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>Hearing Side • Voice or Text</Text>
          </View>

          <View style={styles.hearingInputRow}>
            <TextInput
              style={[styles.hearingTextInput, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, color: isDark ? '#FFFFFF' : colors.brandNavy }]}
              value={hearingText}
              onChangeText={setHearingText}
              placeholder="Type message for Deaf user..."
              placeholderTextColor="#94A3B8"
            />

            <TouchFeedback
              style={[
                styles.micBtn,
                { backgroundColor: isDark ? colors.brandCyan : colors.brandNavy },
                isMicActive && styles.micBtnActive,
              ]}
              onPress={handleToggleMic}
            >
              <Ionicons name={isMicActive ? 'stop' : 'mic'} size={20} color={isMicActive ? '#FFFFFF' : isDark ? '#001A38' : '#FFFFFF'} />
            </TouchFeedback>

            {hearingText.trim().length > 0 && (
              <TouchFeedback
                style={[styles.sendBtn, { backgroundColor: colors.brandCyan }]}
                onPress={() => handleSendHearingMessage()}
              >
                <Ionicons name="send" size={18} color="#001A38" />
              </TouchFeedback>
            )}
          </View>

          {isMicActive && (
            <View style={styles.waveformContainer}>
              <AudioWaveformVisualizer
                isActive={isMicActive}
                barCount={16}
                height={24}
                color={isDark ? colors.brandCyan : colors.brandNavy}
              />
              <Text style={[styles.listeningText, { color: isDark ? colors.brandCyan : colors.brandCyanDark }]}>Listening via Whisper AI...</Text>
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
    paddingTop: 10,
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
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#F1F5F9',
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentBtnTextActive: {
    color: colors.brandNavy,
  },
  avatarSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  liveStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  pulseLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandCyan,
    marginRight: 8,
  },
  liveStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
    flex: 1,
  },
  chatList: {
    marginTop: 12,
    marginBottom: 12,
    gap: 12,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    width: '100%',
  },
  bubbleWrapperDeaf: {
    justifyContent: 'flex-start',
  },
  bubbleWrapperHearing: {
    justifyContent: 'flex-end',
  },
  chatBubble: {
    maxWidth: '85%',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.2,
  },
  chatBubbleDeaf: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderTopLeftRadius: 4,
  },
  chatBubbleHearing: {
    backgroundColor: '#EDF4FC',
    borderColor: '#CBD5E1',
    borderTopRightRadius: 4,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  senderPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderPill: {
    fontSize: 11,
    fontWeight: '800',
  },
  senderDeaf: {
    color: '#4F46E5',
  },
  senderHearing: {
    color: '#059669',
  },
  bubbleTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  urduMessageText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  urduMessageDeaf: {
    color: colors.brandNavy,
    textAlign: 'left',
  },
  urduMessageHearing: {
    color: colors.brandNavyDark,
    textAlign: 'left',
  },
  engMessageText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  bubbleActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brandNavy,
  },
  inputSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.brandNavy,
  },
  camLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brandCyanDark,
  },
  quickSignsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickSignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickSignText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brandNavy,
  },
  hearingInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  hearingTextInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.brandNavy,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  micBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.brandNavy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtnActive: {
    backgroundColor: '#EF4444',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.brandCyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: {
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
  },
  listeningText: {
    fontSize: 11,
    color: colors.brandCyanDark,
    fontWeight: '600',
    marginTop: 4,
  },
});

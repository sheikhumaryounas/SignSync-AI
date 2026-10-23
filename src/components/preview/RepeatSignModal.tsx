import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { SignVocabularyItem } from '../../types';
import { usePreview } from '../../context/PreviewContext';
import { TouchFeedback } from './TouchFeedback';

interface RepeatSignModalProps {
  visible: boolean;
  score: number;
  threshold: number;
  predictedSignName?: string;
  suggestedSigns?: SignVocabularyItem[];
  onRetry: () => void;
  onSelectSuggestion?: (sign: SignVocabularyItem) => void;
  onSwitchToTyping: () => void;
  onDismiss: () => void;
}

export const RepeatSignModal: React.FC<RepeatSignModalProps> = ({
  visible,
  score,
  threshold,
  suggestedSigns = [],
  onRetry,
  onSelectSuggestion,
  onSwitchToTyping,
  onDismiss,
}) => {
  const { theme, isDark } = usePreview();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
          {/* Header Icon & Title */}
          <View style={styles.header}>
            <View style={[styles.warningCircle, isDark && { backgroundColor: '#3B2F08' }]}>
              <Ionicons name="alert-circle-outline" size={24} color={isDark ? '#FBBF24' : '#D97706'} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>Please Repeat the Sign</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Confidence ({Math.round(score * 100)}%) is below threshold ({Math.round(threshold * 100)}%)
              </Text>
            </View>
          </View>

          {/* Guidance Cards */}
          <View style={[styles.guidanceBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
            <Text style={[styles.guidanceTitle, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>Tips for better recognition:</Text>
            
            <View style={styles.tipRow}>
              <Ionicons name="sunny-outline" size={16} color={theme.textSecondary} style={styles.tipIcon} />
              <Text style={[styles.tipText, { color: isDark ? '#E2E8F0' : '#475569' }]}>
                Ensure good lighting with no glare behind you
              </Text>
            </View>

            <View style={styles.tipRow}>
              <Ionicons name="hand-left-outline" size={16} color={theme.textSecondary} style={styles.tipIcon} />
              <Text style={[styles.tipText, { color: isDark ? '#E2E8F0' : '#475569' }]}>
                Keep hands clearly visible inside the camera frame
              </Text>
            </View>

            <View style={styles.tipRow}>
              <Ionicons name="timer-outline" size={16} color={theme.textSecondary} style={styles.tipIcon} />
              <Text style={[styles.tipText, { color: isDark ? '#E2E8F0' : '#475569' }]}>
                Hold the gesture steady for at least 1 second
              </Text>
            </View>
          </View>

          {/* Suggested Matching Signs */}
          {suggestedSigns.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={[styles.suggestionsTitle, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>
                Did you mean one of these?
              </Text>
              <View style={styles.suggestionChips}>
                {suggestedSigns.slice(0, 3).map(sign => (
                  <TouchFeedback
                    key={sign.id}
                    style={[styles.chip, isDark && { backgroundColor: '#08253A', borderColor: 'rgba(0, 229, 255, 0.4)' }]}
                    onPress={() => onSelectSuggestion && onSelectSuggestion(sign)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={14} color={isDark ? '#00E5FF' : colors.brandCyanDark} style={{ marginRight: 4 }} />
                    <Text style={[styles.chipText, isDark && { color: '#00E5FF' }]} numberOfLines={1}>
                      {sign.signNameEnglish.split('/')[0].trim()}
                    </Text>
                  </TouchFeedback>
                ))}
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchFeedback
              style={[styles.retryBtn, isDark && { backgroundColor: '#00B4D8' }]}
              onPress={onRetry}
            >
              <Ionicons name="refresh" size={18} color={isDark ? '#001A38' : '#FFFFFF'} style={{ marginRight: 6 }} />
              <Text style={[styles.retryBtnText, isDark && { color: '#001A38' }]}>Retry Sign Gesture</Text>
            </TouchFeedback>

            <View style={styles.secondaryRow}>
              <TouchFeedback
                style={[styles.typeBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                onPress={onSwitchToTyping}
              >
                <Ionicons name="chatbox-ellipses-outline" size={16} color={isDark ? colors.brandCyan : colors.brandNavy} style={{ marginRight: 4 }} />
                <Text style={[styles.typeBtnText, { color: isDark ? '#FFFFFF' : colors.brandNavy }]}>Switch to Typing</Text>
              </TouchFeedback>

              <TouchFeedback
                style={styles.dismissBtn}
                onPress={onDismiss}
              >
                <Text style={[styles.dismissBtnText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchFeedback>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 26, 56, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#001A38',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.brandNavy,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  guidanceBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  guidanceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandNavy,
    marginBottom: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipIcon: {
    marginRight: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    lineHeight: 16,
  },
  suggestionsContainer: {
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandNavy,
    marginBottom: 8,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F7FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.4)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandCyanDark,
  },
  actions: {
    gap: 8,
  },
  retryBtn: {
    backgroundColor: colors.brandNavy,
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1.5,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandNavy,
  },
  dismissBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
});

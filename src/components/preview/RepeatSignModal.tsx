import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing, useDirection, themedStyles } from '../../theme';
import { SignVocabularyItem } from '../../types';
import { AppText, Button, Chip, IconBadge, IconName } from '../ui';
import { StringKey, useI18n } from '../../i18n';
import { signName } from '../../services/preview/aiEngine';

interface RepeatSignModalProps {
  visible: boolean;
  score: number;
  threshold: number;
  suggestions: SignVocabularyItem[];
  onRetry: () => void;
  onSelectSuggestion: (sign: SignVocabularyItem) => void;
  onTypeInstead: () => void;
  onDismiss: () => void;
}

const tips: { icon: IconName; label: StringKey }[] = [
  { icon: 'sunny-outline', label: 'rec.tipLight' },
  { icon: 'hand-left-outline', label: 'rec.tipFrame' },
  { icon: 'timer-outline', label: 'rec.tipHold' },
];

// Shown when recognition confidence falls below the threshold, so a low score never becomes output.
export function RepeatSignModal({ visible, score, threshold, suggestions, onRetry, onSelectSuggestion, onTypeInstead, onDismiss }: RepeatSignModalProps) {
  const { t, lang } = useI18n();
  const { row } = useDirection();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={onDismiss} accessibilityLabel={t('common.cancel')}>
        <Pressable style={styles.card} onPress={() => undefined} accessibilityViewIsModal>
          <View style={[styles.head, row]}>
            <IconBadge icon="alert-circle-outline" tone="navy" />
            <View style={styles.flex}>
              <AppText variant="title" accessibilityRole="header">
                {t('rec.repeatTitle')}
              </AppText>
              <AppText variant="bodySm" color={palette.ink2}>
                {t('rec.repeatScore', { score: Math.round(score * 100), threshold: Math.round(threshold * 100) })}
              </AppText>
            </View>
          </View>

          <View style={styles.group}>
            <AppText variant="label">{t('rec.tips')}</AppText>
            {tips.map((tip) => (
              <View key={tip.label} style={[styles.tip, row]}>
                <Ionicons name={tip.icon} size={16} color={palette.ink2} />
                <AppText variant="bodySm" color={palette.ink2} style={styles.flex}>
                  {t(tip.label)}
                </AppText>
              </View>
            ))}
          </View>

          {suggestions.length > 0 ? (
            <View style={styles.group}>
              <AppText variant="label">{t('rec.didYouMean')}</AppText>
              <View style={[styles.chips, row]}>
                {suggestions.map((sign) => (
                  <Chip key={sign.id} label={signName(sign, lang)} tone="teal" onPress={() => onSelectSuggestion(sign)} />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.group}>
            <Button title={t('rec.retry')} icon="refresh" onPress={onRetry} />
            <View style={[styles.secondary, row]}>
              <Button title={t('rec.typeInstead')} variant="ghost" onPress={onTypeInstead} style={styles.flex} />
              <Button title={t('common.cancel')} variant="ghost" onPress={onDismiss} style={styles.flex} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = themedStyles(() => ({
  scrim: { flex: 1, backgroundColor: palette.scrim, justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: palette.surface, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg },
  head: { alignItems: 'flex-start', gap: spacing.md },
  flex: { flex: 1 },
  group: { gap: spacing.sm },
  tip: { alignItems: 'center', gap: spacing.sm },
  chips: { flexWrap: 'wrap', gap: spacing.sm },
  secondary: { gap: spacing.sm },
}));

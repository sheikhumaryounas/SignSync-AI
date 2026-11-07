import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing, useDirection, palette } from '../../theme';
import { SignVocabularyItem } from '../../types';
import { AppText, Card, Chip, Notice } from '../ui';
import { useI18n } from '../../i18n';
import { signName } from '../../services/preview/aiEngine';

// What a sentence turned into: the signs in order, plus any words that must be fingerspelled.
export function SignSequenceCard({ signs, unsupportedWords }: { signs: SignVocabularyItem[]; unsupportedWords: string[] }) {
  const { t, lang } = useI18n();
  const { row } = useDirection();

  return (
    <Card style={styles.card}>
      <AppText variant="heading" accessibilityRole="header">
        {t('map.title')}
      </AppText>
      {signs.length > 0 ? (
        <View style={[styles.list, row]}>
          {signs.map((sign, i) => (
            <Chip key={sign.id} label={`${i + 1}. ${signName(sign, lang)}`} tone="teal" />
          ))}
        </View>
      ) : (
        <AppText variant="bodySm" color={palette.ink2}>
          {t('map.none')}
        </AppText>
      )}
      {unsupportedWords.length > 0 ? <Notice message={t('map.fingerspell', { words: unsupportedWords.join(lang === 'ur' ? '، ' : ', ') })} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  list: { flexWrap: 'wrap', gap: spacing.sm },
});

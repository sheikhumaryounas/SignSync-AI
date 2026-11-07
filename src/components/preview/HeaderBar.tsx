import React from 'react';
import { StyleSheet, View } from 'react-native';
import { palette, spacing, useDirection } from '../../theme';
import { usePreview } from '../../context/PreviewContext';
import { AppText, IconButton, StatusPill } from '../ui';
import { useI18n } from '../../i18n';

interface HeaderBarProps {
  title: string;
  onBack: () => void;
  rightAction?: React.ReactNode;
}

// Header for the preview screens. Every one says plainly that it is simulated.
export function HeaderBar({ title, onBack, rightAction }: HeaderBarProps) {
  const { isSpeaking } = usePreview();
  const { t } = useI18n();
  const { row, back } = useDirection();

  return (
    <View style={[styles.header, row]}>
      <IconButton icon={back} tone="outline" onPress={onBack} accessibilityLabel={t('common.back')} />
      <View style={styles.titles}>
        <AppText variant="title" accessibilityRole="header" numberOfLines={1}>
          {title}
        </AppText>
        <View style={[styles.pills, row]}>
          <StatusPill label={t('preview.badge')} tone="info" />
          {isSpeaking ? <StatusPill label={t('preview.speaking')} tone="success" /> : null}
        </View>
      </View>
      {rightAction}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  titles: { flex: 1, minWidth: 0, gap: 4 },
  pills: { flexWrap: 'wrap', gap: spacing.xs },
});

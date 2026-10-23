import React from 'react';
import { StyleSheet, View } from 'react-native';
import { palette, spacing } from '../../theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { IconBadge } from './IconBadge';
import { IconName } from './icons';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <IconBadge icon={icon} />
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      <AppText variant="bodySm" align="center" color={palette.ink2} style={styles.msg}>
        {message}
      </AppText>
      {actionLabel ? <Button title={actionLabel} onPress={onAction} fullWidth={false} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xxl },
  msg: { maxWidth: 260 },
});

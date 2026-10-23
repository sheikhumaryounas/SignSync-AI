import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { palette, radius, spacing } from '../../theme';
import { AppText } from './AppText';
import { Button } from './Button';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// In-app confirmation used for every destructive action, styled like the rest of the app.
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={onCancel} accessibilityLabel={cancelLabel}>
        <Pressable style={styles.card} onPress={() => undefined} accessibilityViewIsModal>
          <View style={styles.text}>
            <AppText variant="title" accessibilityRole="header">
              {title}
            </AppText>
            {message ? (
              <AppText variant="bodySm" color={palette.ink2}>
                {message}
              </AppText>
            ) : null}
          </View>
          <View style={styles.actions}>
            <Button title={cancelLabel} variant="ghost" onPress={onCancel} style={styles.action} />
            <Button
              title={confirmLabel}
              variant={destructive ? 'destructive' : 'primary'}
              loading={busy}
              onPress={onConfirm}
              style={styles.action}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: palette.scrim, justifyContent: 'center', padding: spacing.xxl },
  card: { backgroundColor: palette.surface, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.xl },
  text: { gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1 },
});

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';
import { palette, radius, spacing, useDirection, themedStyles } from '../../theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { useReduceMotion } from './motion';

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
  const { row } = useDirection();
  const reduce = useReduceMotion();
  const pop = useRef(new Animated.Value(0)).current;

  // Card scales up from slightly smaller while the Modal fades the scrim in.
  useEffect(() => {
    if (!visible) return;
    if (reduce) {
      pop.setValue(1);
      return;
    }
    pop.setValue(0);
    Animated.timing(pop, { toValue: 1, duration: 220, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }).start();
  }, [visible, reduce, pop]);

  const cardMotion = {
    opacity: pop.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
    transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={onCancel} accessibilityLabel={cancelLabel}>
        <Animated.View style={cardMotion}>
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
          <View style={[styles.actions, row]}>
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
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = themedStyles(() => ({
  scrim: { flex: 1, backgroundColor: palette.scrim, justifyContent: 'center', padding: spacing.xxl },
  card: { backgroundColor: palette.surface, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.xl },
  text: { gap: spacing.sm },
  actions: { gap: spacing.md },
  action: { flex: 1 },
}));

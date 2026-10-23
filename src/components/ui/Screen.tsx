import React from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { palette, spacing } from '../../theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  white?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
  footer?: React.ReactNode;
}

// Standard screen shell: safe area, canvas background, 16 px gutter, 12 px vertical rhythm.
// Android is edge-to-edge in SDK 57, so the window no longer resizes for the keyboard;
// KeyboardAvoidingView pads on both platforms instead.
export function Screen({ children, scroll = true, white = false, edges = ['top'], contentStyle, footer }: ScreenProps) {
  const bg = { backgroundColor: white ? palette.surface : palette.canvas };
  return (
    <SafeAreaView style={[styles.root, bg]} edges={edges}>
      <KeyboardAvoidingView style={styles.root} behavior="padding">
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
        )}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.md },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
});

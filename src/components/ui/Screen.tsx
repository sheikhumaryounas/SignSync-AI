import React from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { palette, spacing } from '../../theme';
import { usePullRefresh } from './usePullRefresh';
import { FadeIn, Stagger } from './motion';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  white?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
  footer?: React.ReactNode;
  /** Fixed above the scrolling content. */
  header?: React.ReactNode;
  /** Enables pull-to-refresh on the scrolling content. */
  onRefresh?: () => Promise<unknown>;
}

// Standard screen shell: safe area, canvas background, 16 px gutter, 12 px vertical rhythm.
// Android is edge-to-edge in SDK 57, so the window no longer resizes for the keyboard;
// KeyboardAvoidingView pads on both platforms instead.
export function Screen({ children, scroll = true, white = false, edges = ['top'], contentStyle, footer, header, onRefresh }: ScreenProps) {
  const refreshControl = usePullRefresh(onRefresh ?? noop);
  const bg = { backgroundColor: white ? palette.surface : palette.canvas };
  return (
    <SafeAreaView style={[styles.root, bg]} edges={edges}>
      {header}
      <KeyboardAvoidingView style={styles.root} behavior="padding">
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={onRefresh ? refreshControl : undefined}
          >
            {/* Each top-level block fades up in turn when the screen opens. */}
            <Stagger>{children}</Stagger>
          </ScrollView>
        ) : (
          // Fixed layouts may rely on flex children, so the whole block fades in as one.
          <FadeIn style={[styles.content, styles.fill, contentStyle]} offset={16}>
            {children}
          </FadeIn>
        )}
        {footer ? (
          <FadeIn style={styles.footer} delay={160}>
            {footer}
          </FadeIn>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const noop = async () => undefined;

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.md },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
});

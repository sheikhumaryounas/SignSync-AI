import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, palette, radius, spacing, useDirection, themedStyles } from '../../theme';
import { AppText, Chip, Notice } from '../ui';
import { useI18n } from '../../i18n';
import { signName } from '../../services/preview/aiEngine';
import { SignGuess } from '../../services/recognition/signApi';
import { SignRecorder } from './SignRecorder';

interface SignCameraSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Called with the accepted sign; the sheet closes itself. */
  onSign: (guess: SignGuess) => void;
}

// Bottom sheet with the camera, for signing one message inside the conversation.
export function SignCameraSheet({ visible, onClose, onSign }: SignCameraSheetProps) {
  const { t, lang } = useI18n();
  const { row } = useDirection();
  const insets = useSafeAreaInsets();
  const [unclear, setUnclear] = useState<SignGuess[] | null>(null);

  useEffect(() => {
    if (visible) setUnclear(null);
  }, [visible]);

  const accept = (guess: SignGuess) => {
    setUnclear(null);
    onSign(guess);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('common.cancel')} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]} accessibilityViewIsModal>
          <View style={styles.grab} />
          <View style={[styles.head, row]}>
            <AppText variant="title" accessibilityRole="header" style={styles.flex}>
              {t('chat.signTitle')}
            </AppText>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
              <AppText variant="bodySm" color={palette.tealInk} style={styles.link}>
                {t('common.cancel')}
              </AppText>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {visible ? (
              <SignRecorder
                height={280}
                onOpenSettings={onClose}
                onResult={({ guesses, accepted }) => {
                  if (accepted) accept(guesses[0]);
                  else setUnclear(guesses);
                }}
              />
            ) : null}

            {unclear ? (
              <View style={styles.body}>
                <Notice tone="warning" message={`${t('rec.notRecognisedTitle')}. ${t('rec.notRecognisedBody')}`} />
                <AppText variant="label">{t('rec.ifYouMeant')}</AppText>
                <View style={[styles.chips, row]}>
                  {unclear.map((g) => (
                    <Chip key={g.sign.id} label={signName(g.sign, lang)} onPress={() => accept(g)} />
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = themedStyles(() => ({
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    maxHeight: '92%',
    backgroundColor: palette.canvas,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: palette.line },
  head: { alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  link: { fontFamily: fonts.semibold },
  body: { gap: spacing.md },
  chips: { flexWrap: 'wrap', gap: spacing.sm },
}));

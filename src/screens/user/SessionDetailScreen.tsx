import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fonts, palette, radius, shadow, spacing } from '../../theme';
import { AppText, Chip, ConfirmDialog, EmptyState, IconButton, Screen } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../context/PreferencesContext';
import { useFeedback } from '../../context/FeedbackContext';
import { apiErrorText, StringKey, useI18n } from '../../i18n';
import { api, SessionDetail, TranslationRecord } from '../../services/api';
import { OutputLanguage, RootStackParamList } from '../../types';
import { durationLabel, linesFor, whenLabel } from '../../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionDetail'>;

export default function SessionDetailScreen({ navigation, route }: Props) {
  const { accessToken } = useAuth();
  const { prefs } = usePreferences();
  const { notify } = useFeedback();
  const { t, lang } = useI18n();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    api.history
      .get(accessToken, route.params.id)
      .then(setSession)
      .catch(() => setMissing(true));
  }, [accessToken, route.params.id]);

  const onDelete = async () => {
    if (!accessToken || !session) return;
    setDeleting(true);
    try {
      await api.history.remove(accessToken, session.id);
      setConfirming(false);
      notify({ tone: 'success', message: t('session.deleted') });
      navigation.goBack();
    } catch (e) {
      setDeleting(false);
      setConfirming(false);
      notify({ tone: 'error', message: apiErrorText(e, t) });
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.head}>
        <IconButton icon="chevron-back" onPress={navigation.goBack} accessibilityLabel={t('common.back')} />
        {session ? (
          <IconButton
            icon="trash-outline"
            tone="danger"
            onPress={() => setConfirming(true)}
            accessibilityLabel={t('session.delete')}
          />
        ) : null}
      </View>

      {missing ? (
        <EmptyState icon="alert-circle-outline" title={t('session.notFound')} message={t('history.noResultsMsg')} />
      ) : session ? (
        <>
          <View style={styles.titleBlock}>
            <AppText variant="title" accessibilityRole="header">
              {session.title}
            </AppText>
            <View style={styles.chips}>
              <Chip label={t(`mod.${session.modality}` as StringKey)} tone="teal" />
              <Chip label={whenLabel(session.startedAt, t, lang)} />
              <Chip label={durationLabel(session.startedAt, session.endedAt)} />
            </View>
          </View>
          {session.records.map((r) => (
            <Bubble key={r.id} record={r} outputLanguage={prefs.outputLanguage} />
          ))}
        </>
      ) : null}

      <ConfirmDialog
        visible={confirming}
        title={t('session.deleteTitle')}
        message={t('session.deleteMsg')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        busy={deleting}
        onCancel={() => setConfirming(false)}
        onConfirm={onDelete}
      />
    </Screen>
  );
}

function Bubble({ record, outputLanguage }: { record: TranslationRecord; outputLanguage: OutputLanguage }) {
  const { t } = useI18n();
  const mine = record.speaker === 'self';
  const lines = linesFor(outputLanguage, record.outputEn, record.outputUr);
  const who = `${mine ? t('session.you') : record.speakerName} · ${t(`session.via.${record.inputMode}` as StringKey)}`;
  return (
    <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
      <AppText variant="label" color={mine ? palette.muted : palette.onNavyMuted}>
        {who}
      </AppText>
      {record.signSequence.length ? (
        <View style={styles.tokens}>
          {record.signSequence.map((s, i) => (
            <View key={`${s.sign}-${i}`} style={[styles.token, mine ? null : styles.tokenOnNavy]}>
              <AppText style={[styles.tokenText, { color: mine ? palette.tealInk : palette.tealOnNavy }]}>
                {s.sign}
                {s.confidence != null ? (
                  <AppText
                    style={[styles.tokenText, { color: mine ? palette.ink2 : palette.onNavyMuted }]}
                  >{` .${Math.round(s.confidence * 100)}`}</AppText>
                ) : null}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
      {lines.en ? (
        <AppText variant="body" color={mine ? palette.ink : palette.onNavy}>
          {lines.en}
        </AppText>
      ) : null}
      {lines.ur ? (
        <AppText variant="urduSm" color={mine ? palette.ink2 : palette.onNavyMuted}>
          {lines.ur}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleBlock: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  bubble: {
    maxWidth: '88%',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 6,
  },
  mine: {
    alignSelf: 'flex-start',
    backgroundColor: palette.surface,
    borderTopLeftRadius: 5,
    boxShadow: shadow.card,
  },
  theirs: {
    alignSelf: 'flex-end',
    backgroundColor: palette.navy,
    borderTopRightRadius: 5,
  },
  tokens: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  token: {
    backgroundColor: palette.tealSoft,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tokenOnNavy: { backgroundColor: 'rgba(0,179,196,0.18)' },
  tokenText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 0.3,
  },
});

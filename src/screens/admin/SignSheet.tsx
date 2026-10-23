import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, palette, radius, spacing } from '../../theme';
import { AppText, Button, Chip, IconBadge, Input, Notice, SegmentedControl, StatusPill } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { apiErrorText, StringKey, useI18n } from '../../i18n';
import { api, findDuplicate, GestureType, SAMPLE_MAX_BYTES, SAMPLE_MIME, VocabCategory, VocabEntry, VocabStatus } from '../../services/api';

export const CATEGORIES: VocabCategory[] = ['greetings', 'daily', 'medical', 'emergency', 'questions', 'feelings', 'numbers'];

interface PendingClip {
  name: string;
  size: number;
  mimeType: string;
}

interface SignSheetProps {
  visible: boolean;
  entry: VocabEntry | null;
  all: VocabEntry[];
  onClose: () => void;
  onChanged: (entry: VocabEntry) => void;
  onOpenExisting: (entry: VocabEntry) => void;
}

const statusTone = { active: 'success', training: 'warning', retired: 'muted' } as const;

// Add / edit / retire sheet for EUC9. Duplicate names are caught while typing (alt-flow 4.1)
// and retiring asks for confirmation inside the sheet (alt-flow 3.1).
export function SignSheet({ visible, entry, all, onClose, onChanged, onOpenExisting }: SignSheetProps) {
  const { accessToken } = useAuth();
  const { notify } = useFeedback();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [nameEn, setNameEn] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [category, setCategory] = useState<VocabCategory>('daily');
  const [gestureType, setGestureType] = useState<GestureType>('single_hand');
  const [clips, setClips] = useState<PendingClip[]>([]);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<{ nameEn?: string; nameUr?: string; clips?: string; submit?: string }>({});
  const [busy, setBusy] = useState(false);
  const [confirmRetire, setConfirmRetire] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setNameEn(entry?.nameEn ?? '');
    setNameUr(entry?.nameUr ?? '');
    setCategory(entry?.category ?? 'daily');
    setGestureType(entry?.gestureType ?? 'single_hand');
    setClips([]);
    setConsent(false);
    setErrors({});
    setBusy(false);
    setConfirmRetire(false);
  }, [visible, entry]);

  const duplicate = nameEn.trim() ? findDuplicate(all, nameEn, entry?.id) : undefined;

  const pickClips = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: SAMPLE_MIME, multiple: true, copyToCacheDirectory: false });
    if (res.canceled) return;
    const accepted: PendingClip[] = [];
    let problem: string | undefined;
    for (const a of res.assets) {
      const mime = a.mimeType ?? '';
      if (mime !== SAMPLE_MIME && !a.name.toLowerCase().endsWith('.mp4')) problem = t('error.sample_format');
      else if ((a.size ?? 0) > SAMPLE_MAX_BYTES) problem = t('error.sample_size');
      else accepted.push({ name: a.name, size: a.size ?? 0, mimeType: mime || SAMPLE_MIME });
    }
    setClips((c) => [...c, ...accepted]);
    setErrors((e) => ({ ...e, clips: problem }));
  };

  const onSave = async () => {
    if (!accessToken) return;
    const next = {
      nameEn: nameEn.trim() ? undefined : t('error.sign_name_required'),
      nameUr: nameUr.trim() ? undefined : t('error.sign_urdu_required'),
      clips: clips.length && !consent ? t('error.sample_consent') : undefined,
    };
    setErrors(next);
    if (next.nameEn || next.nameUr || next.clips || duplicate) return;

    setBusy(true);
    try {
      const input = { nameEn, nameUr, category, gestureType };
      let saved = entry ? await api.vocabulary.update(accessToken, entry.id, input) : await api.vocabulary.create(accessToken, input);
      for (const c of clips) {
        await api.vocabulary.addSample(accessToken, saved.id, {
          fileName: c.name,
          sizeBytes: c.size,
          mimeType: c.mimeType,
          source: 'project',
          consentRecorded: consent,
        });
        saved = { ...saved, clipCount: saved.clipCount + 1 };
      }
      onChanged(saved);
      notify({ tone: 'success', message: t(entry ? 'sign.saved' : 'sign.created', { name: saved.nameEn }) });
      onClose();
    } catch (e) {
      setErrors({ submit: apiErrorText(e, t) });
      setBusy(false);
    }
  };

  const changeStatus = async (status: VocabStatus, message: StringKey) => {
    if (!accessToken || !entry) return;
    setBusy(true);
    try {
      const updated = await api.vocabulary.setStatus(accessToken, entry.id, status);
      onChanged(updated);
      notify({ tone: status === 'retired' ? 'warning' : 'success', message: t(message, { name: updated.nameEn }) });
      onClose();
    } catch (e) {
      setErrors({ submit: apiErrorText(e, t) });
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('common.cancel')} />
        <KeyboardAvoidingView behavior="padding" style={styles.sheetWrap}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]} accessibilityViewIsModal>
            <View style={styles.grab} />
            <View style={styles.head}>
              <AppText variant="title" accessibilityRole="header">
                {t(entry ? 'sign.editTitle' : 'sign.addTitle')}
              </AppText>
              {entry ? <StatusPill label={t(`status.${entry.status}` as StringKey)} tone={statusTone[entry.status]} /> : null}
              <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" style={styles.cancel}>
                <AppText variant="bodySm" color={palette.tealInk} style={{ fontFamily: fonts.semibold }}>
                  {t('common.cancel')}
                </AppText>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.gapSm}>
                <Input
                  label={t('sign.nameEn')}
                  value={nameEn}
                  onChangeText={(v) => {
                    setNameEn(v);
                    setErrors((e) => ({ ...e, nameEn: undefined }));
                  }}
                  error={
                    errors.nameEn ??
                    (duplicate ? t('sign.duplicate', { name: duplicate.nameEn, category: t(`cat.${duplicate.category}` as StringKey) }) : undefined)
                  }
                  autoCapitalize="words"
                />
                {duplicate ? (
                  <Pressable onPress={() => onOpenExisting(duplicate)} hitSlop={8} accessibilityRole="link" style={styles.alignStart}>
                    <AppText variant="caption" color={palette.tealInk} style={{ fontFamily: fonts.semibold }}>
                      {t('sign.openExisting')}
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
              <Input
                label={t('sign.nameUr')}
                urdu
                value={nameUr}
                onChangeText={(v) => {
                  setNameUr(v);
                  setErrors((e) => ({ ...e, nameUr: undefined }));
                }}
                error={errors.nameUr}
              />

              <View style={styles.gapSm}>
                <AppText variant="label">{t('sign.category')}</AppText>
                <View style={styles.chips}>
                  {CATEGORIES.map((c) => (
                    <Chip key={c} label={t(`cat.${c}` as StringKey)} selected={c === category} onPress={() => setCategory(c)} />
                  ))}
                </View>
              </View>

              <View style={styles.gapSm}>
                <AppText variant="label">{t('sign.gesture')}</AppText>
                <SegmentedControl<GestureType>
                  accessibilityLabel={t('sign.gesture')}
                  value={gestureType}
                  onChange={setGestureType}
                  options={[
                    { value: 'single_hand', label: t('gesture.single_hand') },
                    { value: 'two_hand', label: t('gesture.two_hand') },
                    { value: 'body', label: t('gesture.body') },
                  ]}
                />
              </View>

              <View style={styles.gapSm}>
                <AppText variant="label">{t('sign.clips')}</AppText>
                <Pressable onPress={pickClips} style={styles.upload} accessibilityRole="button" accessibilityLabel={t('sign.addClip')}>
                  <IconBadge icon="videocam-outline" size="sm" />
                  <View style={styles.flex}>
                    <AppText variant="heading">
                      {[
                        entry ? t('sign.clipsSaved', { n: entry.clipCount }) : null,
                        clips.length ? t('sign.clipsPending', { n: clips.length }) : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || t('sign.addClip')}
                    </AppText>
                    <AppText variant="caption">{t('sign.clipsHint')}</AppText>
                  </View>
                  <AppText variant="bodySm" color={palette.tealInk} style={{ fontFamily: fonts.semibold }}>
                    {t('sign.addClip')}
                  </AppText>
                </Pressable>
                {clips.map((c, i) => (
                  <View key={`${c.name}-${i}`} style={styles.clip}>
                    <Ionicons name="film-outline" size={14} color={palette.ink2} />
                    <AppText variant="caption" numberOfLines={1} style={styles.flex}>
                      {c.name}
                    </AppText>
                    <AppText variant="caption" color={palette.muted}>
                      {(c.size / (1024 * 1024)).toFixed(1)} MB
                    </AppText>
                  </View>
                ))}
                {clips.length ? (
                  <Pressable onPress={() => setConsent((v) => !v)} style={styles.consent} accessibilityRole="checkbox" accessibilityState={{ checked: consent }}>
                    <View style={[styles.box, consent ? styles.boxOn : null]}>
                      {consent ? <Ionicons name="checkmark" size={12} color={palette.navy} /> : null}
                    </View>
                    <AppText variant="caption" style={styles.flex}>
                      {t('sign.consent')}
                    </AppText>
                  </Pressable>
                ) : null}
                {errors.clips ? <Notice tone="error" message={errors.clips} /> : null}
              </View>

              {errors.submit ? <Notice tone="error" message={errors.submit} /> : null}

              <Button title={t('sign.save')} onPress={onSave} loading={busy && !confirmRetire} disabled={!!duplicate} />

              {entry && !confirmRetire ? (
                <View style={styles.actions}>
                  {entry.status === 'active' ? (
                    <Button title={t('sign.queue')} variant="ghost" icon="refresh-outline" onPress={() => changeStatus('training', 'sign.queued')} />
                  ) : null}
                  {entry.status === 'retired' ? (
                    <Button title={t('sign.restore')} variant="ghost" icon="arrow-undo-outline" onPress={() => changeStatus('active', 'sign.restored')} />
                  ) : (
                    <Button title={t('sign.retire')} variant="danger" icon="archive-outline" onPress={() => setConfirmRetire(true)} />
                  )}
                </View>
              ) : null}

              {entry && confirmRetire ? (
                <View style={styles.confirm}>
                  <AppText variant="heading">{t('sign.retireTitle', { name: entry.nameEn })}</AppText>
                  <AppText variant="caption">{t('sign.retireMsg')}</AppText>
                  <View style={styles.row}>
                    <Button title={t('common.cancel')} variant="ghost" onPress={() => setConfirmRetire(false)} style={styles.flex} />
                    <Button title={t('sign.retire')} variant="destructive" loading={busy} onPress={() => changeStatus('retired', 'sign.retired')} style={styles.flex} />
                  </View>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: palette.scrim, justifyContent: 'flex-end' },
  sheetWrap: { maxHeight: '92%' },
  sheet: { backgroundColor: palette.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: spacing.sm },
  grab: { width: 40, height: 4, borderRadius: 2, backgroundColor: palette.line, alignSelf: 'center', marginBottom: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  cancel: { marginLeft: 'auto' },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.lg },
  gapSm: { gap: spacing.sm },
  alignStart: { alignSelf: 'flex-start' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  upload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md - 2,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: palette.outline,
    backgroundColor: palette.canvas,
  },
  clip: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xs },
  consent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 32 },
  box: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: palette.outline, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: palette.teal, borderColor: palette.teal },
  actions: { gap: spacing.sm },
  confirm: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: palette.errorSoft },
  row: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  flex: { flex: 1, minWidth: 0 },
});

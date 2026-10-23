import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing } from '../../theme';
import {
  AppText,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  IconBadge,
  IconName,
  Input,
  Notice,
  Screen,
  SegmentedControl,
  StatusPill,
  StatusTone,
  Toggle,
} from '../../components/ui';
import { usePreferences } from '../../context/PreferencesContext';
import { FeedbackChannel, useFeedback } from '../../context/FeedbackContext';
import { apiErrorText, StringKey, useI18n } from '../../i18n';
import { hasFeedbackChannel, PreferenceProfile, PreferenceSettings, sameSettings } from '../../services/api';
import { OutputLanguage } from '../../types';

type ChannelKey = 'visualFeedback' | 'audioFeedback' | 'hapticFeedback';

const channels: { key: ChannelKey; channel: FeedbackChannel; icon: IconName; title: StringKey; desc: StringKey }[] = [
  { key: 'visualFeedback', channel: 'visual', icon: 'eye-outline', title: 'fb.visual', desc: 'prefs.visualDesc' },
  { key: 'audioFeedback', channel: 'audio', icon: 'volume-medium-outline', title: 'fb.audio', desc: 'prefs.audioDesc' },
  { key: 'hapticFeedback', channel: 'haptic', icon: 'phone-portrait-outline', title: 'fb.haptic', desc: 'prefs.hapticDesc' },
];

export default function PreferencesScreen() {
  const { t } = useI18n();
  const { prefs, syncState, profiles, save, createProfile, deleteProfile, applyProfile } = usePreferences();
  const { notify, preview } = useFeedback();
  const [draft, setDraft] = useState<PreferenceSettings>(prefs);
  const [blocked, setBlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [naming, setNaming] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileError, setProfileError] = useState<string>();
  const [toDelete, setToDelete] = useState<PreferenceProfile | null>(null);

  const dirty = !sameSettings(draft, prefs);

  // Follow changes made elsewhere (initial load, applying a profile) while nothing is being edited.
  useEffect(() => {
    if (!dirty) setDraft(prefs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs]);

  const setChannel = (key: ChannelKey, channel: FeedbackChannel, on: boolean) => {
    const next = { ...draft, [key]: on };
    // EUC3 business rule 1 / TC-ACC-03: the last channel can't be switched off.
    if (!hasFeedbackChannel(next)) {
      setBlocked(true);
      return;
    }
    setBlocked(false);
    setDraft(next);
    if (on) preview(channel, channel === 'audio' ? t('prefs.previewAudio') : t('prefs.previewVisual'));
  };

  const onSave = async () => {
    setSaving(true);
    const ok = await save(draft);
    setSaving(false);
    notify(ok ? { tone: 'success', message: t('prefs.saved') } : { tone: 'warning', message: t('prefs.saveFailed') });
  };

  const onApply = async (p: PreferenceProfile) => {
    setBlocked(false);
    setDraft(p.settings);
    const ok = await applyProfile(p);
    notify(ok ? { tone: 'success', message: t('prefs.profileApplied', { name: p.name }) } : { tone: 'warning', message: t('prefs.saveFailed') });
  };

  const onCreateProfile = async () => {
    try {
      const created = await createProfile(profileName);
      setNaming(false);
      setProfileName('');
      setProfileError(undefined);
      notify({ tone: 'success', message: t('prefs.profileSaved', { name: created.name }) });
    } catch (e) {
      setProfileError(apiErrorText(e, t));
    }
  };

  const status: { label: string; tone: StatusTone } = dirty
    ? { label: t('prefs.unsaved'), tone: 'warning' }
    : syncState === 'saving'
      ? { label: t('prefs.saving'), tone: 'info' }
      : syncState === 'local'
        ? { label: t('prefs.offline'), tone: 'warning' }
        : { label: t('prefs.synced'), tone: 'success' };

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {dirty ? <Button title={t('prefs.discard')} variant="ghost" onPress={() => { setDraft(prefs); setBlocked(false); }} style={styles.flex} /> : null}
          <Button title={t('prefs.save')} onPress={onSave} disabled={!dirty} loading={saving} style={styles.flex} />
        </View>
      }
    >
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          {t('prefs.title')}
        </AppText>
        <StatusPill label={status.label} tone={status.tone} />
      </View>

      <View style={styles.group}>
        <AppText variant="label">{t('register.outputLanguage')}</AppText>
        <SegmentedControl<OutputLanguage>
          accessibilityLabel={t('register.outputLanguage')}
          value={draft.outputLanguage}
          onChange={(v) => setDraft({ ...draft, outputLanguage: v })}
          options={[
            { value: 'english', label: t('register.langEnglish') },
            { value: 'urdu', label: t('register.langUrdu'), urdu: true },
            { value: 'bilingual', label: t('register.langBoth') },
          ]}
        />
      </View>

      <View style={styles.group}>
        <AppText variant="label">{t('prefs.feedback')}</AppText>
        <Card style={styles.list}>
          {channels.map((c, i) => (
            <View key={c.key} style={[styles.row, i > 0 ? styles.divider : null]}>
              <IconBadge icon={c.icon} size="sm" tone={draft[c.key] ? 'teal' : 'navy'} />
              <View style={styles.flex}>
                <AppText variant="heading">{t(c.title)}</AppText>
                <AppText variant="caption">{t(c.desc)}</AppText>
              </View>
              <Toggle value={draft[c.key]} onValueChange={(on) => setChannel(c.key, c.channel, on)} accessibilityLabel={t(c.title)} />
            </View>
          ))}
        </Card>
        {blocked ? (
          <Notice tone="warning" message={t('prefs.ruleBlocked')} />
        ) : (
          <View style={styles.hint}>
            <Ionicons name="information-circle-outline" size={14} color={palette.ink2} />
            <AppText variant="caption">{t('prefs.ruleHint')}</AppText>
          </View>
        )}
      </View>

      <Card style={styles.inline}>
        <AppText variant="heading" style={styles.flex}>
          {t('prefs.textSize')}
        </AppText>
        <SegmentedControl<'normal' | 'large'>
          size="sm"
          style={styles.sizeSeg}
          accessibilityLabel={t('prefs.textSize')}
          value={draft.fontSize}
          onChange={(v) => setDraft({ ...draft, fontSize: v })}
          options={[
            { value: 'normal', label: t('prefs.normal') },
            { value: 'large', label: t('prefs.large') },
          ]}
        />
      </Card>

      <View style={styles.group}>
        <AppText variant="label">{t('prefs.profiles')}</AppText>
        <View style={styles.chips}>
          {profiles.map((p) => (
            <Chip
              key={p.id}
              label={p.name}
              tone={sameSettings(p.settings, prefs) ? 'teal' : 'default'}
              onPress={() => onApply(p)}
              onLongPress={() => setToDelete(p)}
              accessibilityHint={t('prefs.profileHint')}
            />
          ))}
          {!naming ? <Chip label={t('prefs.newProfile')} tone="dashed" onPress={() => setNaming(true)} /> : null}
        </View>
        {naming ? (
          <View style={styles.group}>
            <Input
              label={t('prefs.profileName')}
              value={profileName}
              onChangeText={(v) => {
                setProfileName(v);
                setProfileError(undefined);
              }}
              error={profileError}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={onCreateProfile}
            />
            <View style={styles.footer}>
              <Button title={t('common.cancel')} variant="ghost" onPress={() => { setNaming(false); setProfileError(undefined); }} style={styles.flex} />
              <Button title={t('prefs.profileSave')} variant="teal" onPress={onCreateProfile} style={styles.flex} />
            </View>
          </View>
        ) : profiles.length ? (
          <AppText variant="caption">{t('prefs.profileHint')}</AppText>
        ) : null}
      </View>

      <ConfirmDialog
        visible={!!toDelete}
        title={t('prefs.profileDeleteTitle', { name: toDelete?.name ?? '' })}
        message={t('prefs.profileDeleteMsg')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await deleteProfile(toDelete.id);
          setToDelete(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40, gap: spacing.md },
  group: { gap: spacing.sm },
  list: { paddingVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm + 2 },
  divider: { borderTopWidth: 1, borderTopColor: palette.line2 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  sizeSeg: { width: 160 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});

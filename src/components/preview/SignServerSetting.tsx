import React, { useState } from 'react';
import { View } from 'react-native';
import { spacing, useDirection, themedStyles } from '../../theme';
import { AppText, Button, Input } from '../ui';
import { useI18n } from '../../i18n';
import { useFeedback } from '../../context/FeedbackContext';
import {
  customSignApiUrl,
  normalizeServerUrl,
  setCustomSignApiUrl,
  signApiUrl,
  testSignServer,
} from '../../services/recognition/signApi';

// Settings entry for the sign-recognition server address. The automatic address works when the app
// runs from `expo start` on the same laptop; this is for every other set-up (tunnel, another machine).
export function SignServerSetting() {
  const { t } = useI18n();
  const { notify } = useFeedback();
  const { row } = useDirection();
  const [value, setValue] = useState(customSignApiUrl() ?? '');
  const [error, setError] = useState<string>();
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(customSignApiUrl());

  const automatic = saved ? null : signApiUrl();

  const onSave = async () => {
    const url = normalizeServerUrl(value);
    if (!url) {
      setError(t(value.trim() ? 'server.invalid' : 'server.required'));
      return;
    }
    setTesting(true);
    const ok = await testSignServer(url);
    setTesting(false);
    if (!ok) {
      setError(t('server.unreachable', { url }));
      return;
    }
    await setCustomSignApiUrl(url);
    setSaved(url);
    setValue(url);
    notify({ tone: 'success', message: t('server.saved') });
  };

  const onReset = async () => {
    await setCustomSignApiUrl(null);
    setSaved(null);
    setValue('');
    setError(undefined);
    notify({ tone: 'info', message: t('server.reset') });
  };

  return (
    <View style={styles.group}>
      <AppText variant="label">{t('server.title')}</AppText>
      <Input
        value={value}
        onChangeText={(v) => {
          setValue(v);
          setError(undefined);
        }}
        placeholder="192.168.1.20:8000"
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={100}
        returnKeyType="done"
        onSubmitEditing={onSave}
        error={error}
        hint={saved ? t('server.usingSaved') : automatic ? t('server.usingAuto', { url: automatic }) : t('server.none')}
        accessibilityLabel={t('server.title')}
        raised
      />
      <View style={[styles.actions, row]}>
        {saved ? <Button title={t('server.useAuto')} variant="ghost" onPress={onReset} style={styles.flex} /> : null}
        <Button title={t('server.save')} variant="teal" loading={testing} onPress={onSave} style={styles.flex} />
      </View>
    </View>
  );
}

const styles = themedStyles(() => ({
  group: { gap: spacing.sm },
  actions: { gap: spacing.sm },
  flex: { flex: 1 },
}));

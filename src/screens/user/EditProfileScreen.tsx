import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { palette, spacing, themedStyles, useDirection } from '../../theme';
import { AppText, Avatar, Button, IconButton, Input, Notice, Screen } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { apiErrorText, StringKey, useI18n } from '../../i18n';
import { ApiError, validateEmail, validateName } from '../../services/api';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const { user, updateProfile } = useAuth();
  const { notify } = useFeedback();
  const { t } = useI18n();
  const { row, back } = useDirection();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  // Photo edits stay local until Save: string = new photo, null = removed.
  const [photo, setPhoto] = useState<string | null>(user?.avatarUrl ?? null);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [formError, setFormError] = useState<string>();
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const photoChanged = photo !== (user.avatarUrl ?? null);
  const dirty = name.trim() !== user.name || email.trim().toLowerCase() !== user.email || photoChanged;

  // Opening the photo library needs no permission prompt; the crop keeps it square.
  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: true,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;
    // Stored as a data: URI so it survives cache clean-up and works on web too.
    setPhoto(asset.base64 ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` : asset.uri);
  };

  const onSave = async () => {
    const nameCode = validateName(name);
    const emailCode = validateEmail(email);
    const next = {
      name: nameCode ? t(`error.${nameCode}` as StringKey) : undefined,
      email: emailCode ? t(`error.${emailCode}` as StringKey) : undefined,
    };
    setErrors(next);
    setFormError(undefined);
    if (next.name || next.email) return;

    setSaving(true);
    try {
      await updateProfile({ name, email, avatarUrl: photoChanged ? photo : undefined });
      notify({ tone: 'success', message: t('editProfile.saved') });
      navigation.goBack();
    } catch (e) {
      setSaving(false);
      const field = e instanceof ApiError ? (e.code === 'email_taken' ? 'email' : e.details?.field) : undefined;
      if (field === 'name' || field === 'email') setErrors({ [field]: apiErrorText(e, t) });
      else setFormError(apiErrorText(e, t));
    }
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={<Button title={t('prefs.save')} onPress={onSave} disabled={!dirty} loading={saving} />}
    >
      <View style={[styles.head, row]}>
        <IconButton icon={back} onPress={navigation.goBack} accessibilityLabel={t('common.back')} />
        <AppText variant="title" accessibilityRole="header" style={styles.flex}>
          {t('editProfile.title')}
        </AppText>
      </View>

      <View style={styles.photoBlock}>
        <Pressable
          onPress={pickPhoto}
          accessibilityRole="button"
          accessibilityLabel={t(photo ? 'profile.changePhoto' : 'profile.addPhoto')}
          style={({ pressed }) => (pressed ? { opacity: 0.75 } : null)}
        >
          <Avatar name={name || user.name} uri={photo ?? undefined} size={96} />
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={16} color={palette.onTeal} />
          </View>
        </Pressable>
        <View style={[styles.photoActions, row]}>
          <Pressable onPress={pickPhoto} accessibilityRole="button" hitSlop={8}>
            <AppText variant="caption" color={palette.tealInk}>
              {t(photo ? 'profile.changePhoto' : 'profile.addPhoto')}
            </AppText>
          </Pressable>
          {photo ? (
            <Pressable onPress={() => setPhoto(null)} accessibilityRole="button" hitSlop={8}>
              <AppText variant="caption" color={palette.error}>
                {t('profile.removePhoto')}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Input
        label={t('register.name')}
        icon="person-outline"
        value={name}
        onChangeText={(v) => {
          setName(v);
          setErrors((e) => ({ ...e, name: undefined }));
        }}
        error={errors.name}
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="next"
        raised
      />
      <Input
        label={t('common.email')}
        icon="mail-outline"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          setErrors((e) => ({ ...e, email: undefined }));
        }}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="done"
        onSubmitEditing={onSave}
        hint={t('editProfile.emailHint')}
        raised
      />

      {formError ? <Notice tone="error" message={formError} /> : null}
    </Screen>
  );
}

const styles = themedStyles(() => ({
  head: { alignItems: 'center', gap: spacing.md, minHeight: 44 },
  flex: { flex: 1, minWidth: 0 },
  photoBlock: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: palette.teal,
    borderWidth: 2,
    borderColor: palette.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: { gap: spacing.lg, alignItems: 'center' },
}));

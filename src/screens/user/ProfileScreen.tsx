import React, { useState } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, useDirection, themedStyles } from '../../theme';
import { AppText, Avatar, Button, Card, ConfirmDialog, IconBadge, IconName, Screen, StatusPill } from '../../components/ui';
import { LanguageToggle } from '../../components/LanguageToggle';
import { useAuth } from '../../context/AuthContext';
import { StringKey, useI18n } from '../../i18n';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout, refreshUser } = useAuth();
  const { t, lang } = useI18n();
  const { row: dirRow, forward } = useDirection();
  const [confirming, setConfirming] = useState(false);

  if (!user) return null;
  const isAdmin = user.role === 'admin';
  const since = new Date(user.createdAt).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-PK', { month: 'long', year: 'numeric' });

  const rows: { icon: IconName; label: StringKey; onPress: () => void }[] = [
    { icon: 'create-outline', label: 'editProfile.title', onPress: () => navigation.navigate('EditProfile') },
    { icon: 'options-outline', label: 'profile.preferences', onPress: () => navigation.navigate('Preferences') },
    ...(isAdmin ? [] : [{ icon: 'time-outline' as IconName, label: 'profile.history' as StringKey, onPress: () => navigation.navigate('CommunicationHistory') }]),
  ];

  return (
    <Screen onRefresh={refreshUser}>
      <AppText variant="title" accessibilityRole="header">
        {t('profile.title')}
      </AppText>

      <Card
        style={{ ...styles.identity, ...(dirRow as ViewStyle) }}
        onPress={() => navigation.navigate('EditProfile')}
        accessibilityLabel={t('editProfile.title')}
      >
        <View>
          <Avatar name={user.name} uri={user.avatarUrl} size={64} />
          <View style={styles.cameraBadge}>
            <Ionicons name="pencil" size={12} color={palette.onTeal} />
          </View>
        </View>
        <View style={styles.flex}>
          <AppText variant="heading" numberOfLines={1}>
            {user.name}
          </AppText>
          <AppText variant="caption" numberOfLines={1}>
            {user.email}
          </AppText>
          <View style={[styles.pillRow, dirRow]}>
            <StatusPill label={t(`profile.role.${user.role}` as StringKey)} tone="info" />
          </View>
        </View>
      </Card>
      <AppText variant="caption" align="center">
        {t('profile.memberSince', { date: since })}
      </AppText>

      <Card padded={false}>
        {rows.map((r, i) => (
          <Pressable
            key={r.label}
            onPress={r.onPress}
            accessibilityRole="button"
            style={({ pressed }) => [styles.row, dirRow, i > 0 ? styles.divider : null, pressed ? { opacity: 0.7 } : null]}
          >
            <IconBadge icon={r.icon} size="sm" tone="navy" />
            <AppText variant="heading" style={styles.flex}>
              {t(r.label)}
            </AppText>
            <Ionicons name={forward} size={16} color={palette.muted} />
          </Pressable>
        ))}
        <View style={[styles.row, dirRow, styles.divider]}>
          <IconBadge icon="language-outline" size="sm" tone="navy" />
          <AppText variant="heading" style={styles.flex}>
            {t('profile.language')}
          </AppText>
          <LanguageToggle />
        </View>
      </Card>

      <Button title={t('profile.signOut')} variant="danger" icon="log-out-outline" onPress={() => setConfirming(true)} />

      <ConfirmDialog
        visible={confirming}
        title={t('profile.signOutTitle')}
        message={t('profile.signOutMsg')}
        confirmLabel={t('profile.signOut')}
        cancelLabel={t('common.cancel')}
        destructive
        onCancel={() => setConfirming(false)}
        // The root navigator switches to Welcome once the session is cleared.
        onConfirm={logout}
      />
    </Screen>
  );
}

const styles = themedStyles(() => ({
  identity: { alignItems: 'center', gap: spacing.lg, padding: spacing.lg },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.teal,
    borderWidth: 2,
    borderColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillRow: { marginTop: spacing.xs },
  row: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, minHeight: 56 },
  divider: { borderTopWidth: 1, borderTopColor: palette.line2 },
  flex: { flex: 1, minWidth: 0 },
}));

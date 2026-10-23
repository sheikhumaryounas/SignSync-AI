import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, palette, spacing } from '../../theme';
import { AppText, Button, Card, ConfirmDialog, IconBadge, IconName, Screen, StatusPill } from '../../components/ui';
import { LanguageToggle } from '../../components/LanguageToggle';
import { useAuth } from '../../context/AuthContext';
import { StringKey, useI18n } from '../../i18n';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const { t, lang } = useI18n();
  const [confirming, setConfirming] = useState(false);

  if (!user) return null;
  const isAdmin = user.role === 'admin';
  const since = new Date(user.createdAt).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-PK', { month: 'long', year: 'numeric' });

  const rows: { icon: IconName; label: StringKey; onPress: () => void }[] = [
    { icon: 'options-outline', label: 'profile.preferences', onPress: () => navigation.navigate('Preferences') },
    ...(isAdmin ? [] : [{ icon: 'time-outline' as IconName, label: 'profile.history' as StringKey, onPress: () => navigation.navigate('CommunicationHistory') }]),
  ];

  return (
    <Screen>
      <AppText variant="title" accessibilityRole="header">
        {t('profile.title')}
      </AppText>

      <Card style={styles.identity}>
        <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no">
          <AppText style={styles.avatarText}>{initials(user.name)}</AppText>
        </View>
        <View style={styles.flex}>
          <AppText variant="heading" numberOfLines={1}>
            {user.name}
          </AppText>
          <AppText variant="caption" numberOfLines={1}>
            {user.email}
          </AppText>
          <View style={styles.pillRow}>
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
            style={({ pressed }) => [styles.row, i > 0 ? styles.divider : null, pressed ? { opacity: 0.7 } : null]}
          >
            <IconBadge icon={r.icon} size="sm" tone="navy" />
            <AppText variant="heading" style={styles.flex}>
              {t(r.label)}
            </AppText>
            <Ionicons name="chevron-forward" size={16} color={palette.muted} />
          </Pressable>
        ))}
        <View style={[styles.row, styles.divider]}>
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

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 24, color: palette.white },
  pillRow: { flexDirection: 'row', marginTop: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, minHeight: 56 },
  divider: { borderTopWidth: 1, borderTopColor: palette.line2 },
  flex: { flex: 1, minWidth: 0 },
});

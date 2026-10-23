import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { usePreview } from '../../context/PreviewContext';
import { AppLogo } from '../AppLogo';
import { TouchFeedback } from './TouchFeedback';
import { StatusPill } from '../ui';
import { useI18n } from '../../i18n';

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showLiveBadge?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  showLiveBadge = false,
}) => {
  const { isSpeaking, theme, isDark } = usePreview();
  const { t } = useI18n();

  return (
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <View style={styles.left}>
        {onBack ? (
          <TouchFeedback
            style={[
              styles.backButton,
              {
                backgroundColor: theme.surfaceSecondary,
                borderColor: theme.border,
                shadowColor: isDark ? '#000000' : '#001A38',
              },
            ]}
            onPress={onBack}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={isDark ? colors.brandCyan : colors.brandNavy}
              style={styles.backIcon}
            />
          </TouchFeedback>
        ) : (
          <View style={styles.miniLogoBox}>
            <AppLogo size="small" showImageOnly isDark={isDark} />
          </View>
        )}

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : colors.brandNavy }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
          {/* Every preview screen says plainly that it is simulated FYP-2 work. */}
          <View style={styles.previewRow}>
            <StatusPill label={t('preview.badge')} tone="info" />
          </View>
        </View>
      </View>

      <View style={styles.right}>
        {isSpeaking && (
          <View style={[styles.speakingBadge, isDark && { backgroundColor: '#063B2B', borderColor: '#059669' }]}>
            <Ionicons name="volume-high" size={14} color={isDark ? '#34D399' : '#008F6B'} style={{ marginRight: 4 }} />
            <Text style={[styles.speakingText, isDark && { color: '#34D399' }]}>Speaking</Text>
          </View>
        )}

        {showLiveBadge && (
          <View style={[styles.liveBadge, isDark && { backgroundColor: '#08253A', borderColor: 'rgba(0, 229, 255, 0.4)' }]}>
            <View style={styles.liveDot} />
            <Text style={[styles.liveText, isDark && { color: '#00E5FF' }]}>LIVE SYNC</Text>
          </View>
        )}

        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backIcon: {
    marginLeft: -1, // optical center for chevron
  },
  miniLogoBox: {
    marginRight: 14,
  },
  previewRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.brandNavy,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  speakingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F9F4',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  speakingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#008F6B',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F7FA',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandCyan,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brandCyanDark,
    letterSpacing: 0.5,
  },
});

import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, palette, radius, spacing, useDirection, themedStyles } from '../../theme';
import { useI18n } from '../../i18n';
import { AppText } from './AppText';
import { IconName } from './icons';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  icon?: IconName;
  error?: string;
  hint?: string;
  hintTone?: 'neutral' | 'success';
  password?: boolean;
  urdu?: boolean;
  raised?: boolean;
}

export function Input({
  label,
  icon,
  error,
  hint,
  hintTone = 'neutral',
  password = false,
  urdu = false,
  raised = false,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const { t } = useI18n();
  const { isRTL, row } = useDirection();
  // Emails and passwords stay left-to-right even in the Urdu UI.
  const alignRight = isRTL && !password && rest.keyboardType !== 'email-address';
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const boxState = error ? styles.boxError : focused ? styles.boxFocus : raised ? styles.boxRaised : null;
  const message = error ?? hint;
  const messageColor = error ? palette.error : hintTone === 'success' ? palette.success : palette.ink2;
  const messageIcon: IconName = error ? 'alert-circle-outline' : hintTone === 'success' ? 'checkmark' : 'information-circle-outline';

  return (
    <View style={styles.field}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      <View style={[styles.box, row, boxState]}>
        {icon ? <Ionicons name={icon} size={16} color={palette.muted} /> : null}
        <TextInput
          {...rest}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          secureTextEntry={password && hidden}
          placeholderTextColor={palette.muted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, alignRight ? styles.right : null, urdu ? styles.urdu : null]}
        />
        {password ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={hidden ? t('common.showPassword') : t('common.hidePassword')}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={16} color={palette.muted} />
          </Pressable>
        ) : null}
      </View>
      {message ? (
        <View style={[styles.hintRow, row]} accessibilityLiveRegion={error ? 'polite' : 'none'}>
          <Ionicons name={messageIcon} size={13} color={messageColor} style={styles.hintIcon} />
          <AppText variant="caption" color={messageColor} style={styles.hintText}>
            {message}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = themedStyles(() => ({
  field: { gap: 6 },
  box: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: palette.canvas,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  boxRaised: { backgroundColor: palette.surface, borderColor: palette.line },
  boxFocus: { backgroundColor: palette.surface, borderColor: palette.teal },
  boxError: { backgroundColor: palette.surface, borderColor: palette.error },
  input: {
    flex: 1,
    minHeight: 44,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: palette.ink,
    paddingVertical: 0,
    // The teal border already shows focus; drop the browser outline on web builds.
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : null),
  },
  right: { textAlign: 'right' },
  urdu: { fontFamily: fonts.urdu, fontSize: 16, lineHeight: 34, textAlign: 'right', writingDirection: 'rtl' },
  hintRow: { gap: 6, alignItems: 'flex-start' },
  hintIcon: { marginTop: 2 },
  hintText: { flex: 1 },
}));

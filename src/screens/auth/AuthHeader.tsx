import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from '../../components/ui';
import { useI18n } from '../../i18n';

// Back button on the left, language toggle or step label on the right.
export function AuthHeader({ onBack, right }: { onBack?: () => void; right: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <View style={styles.row}>
      {onBack ? <IconButton icon="chevron-back" tone="outline" onPress={onBack} accessibilityLabel={t('common.back')} /> : <View />}
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 },
});

import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { palette, spacing, useDirection, themedStyles } from '../../theme';
import { RootStackParamList } from '../../types';
import { AppText, Button, Card, Chip, Input, Screen } from '../../components/ui';
import { usePreview } from '../../context/PreviewContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useI18n } from '../../i18n';
import { HeaderBar } from '../../components/preview/HeaderBar';
import { SignAvatarComponent } from '../../components/preview/SignAvatarComponent';
import { SignSequenceCard } from '../../components/preview/SignSequenceCard';
import { mapTextToSignSequence, signNameEn } from '../../services/preview/aiEngine';
import { quickPhrases } from '../../services/preview/mockData';
import { isUrduText } from '../../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'TextToSign'>;

export default function TextToSignScreen({ navigation }: Props) {
  const { preferences, addSession } = usePreview();
  const { notify } = useFeedback();
  const { t, lang } = useI18n();
  const { row } = useDirection();
  const openedAt = useRef(Date.now());
  const [text, setText] = useState(lang === 'ur' ? quickPhrases[0].ur : quickPhrases[0].en);

  const { supportedSigns, unsupportedWords } = mapTextToSignSequence(text);

  const onSave = () => {
    const input = text.trim();
    if (!input) {
      notify({ tone: 'warning', message: t('preview.nothingToSave') });
      return;
    }
    addSession({
      userId: preferences.userId,
      title: `${t('home.modeType')}: ${input.slice(0, 24)}`,
      modality: 'text_to_sign',
      inputText: input,
      outputTextUrdu: input,
      outputTextEnglish: input,
      signSequence: supportedSigns.map(signNameEn),
      averageConfidence: 1,
      duration: `${Math.max(1, Math.round((Date.now() - openedAt.current) / 1000))}s`,
      feedbackGiven: 'up',
    });
    notify({ tone: 'success', message: t('preview.saved') });
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      contentStyle={styles.content}
      header={
        <HeaderBar
          title={t('home.modeType')}
          onBack={navigation.goBack}
          rightAction={<Button title={t('preview.save')} icon="bookmark-outline" variant="ghost" fullWidth={false} style={styles.save} onPress={onSave} />}
        />
      }
    >
      <Card style={styles.card}>
        <View style={[styles.head, row]}>
          <AppText variant="heading" accessibilityRole="header">
            {t('type.title')}
          </AppText>
          {text.length > 0 ? <Chip label={t('preview.clear')} onPress={() => setText('')} /> : null}
        </View>
        <Input
          value={text}
          onChangeText={setText}
          urdu={isUrduText(text)}
          multiline
          numberOfLines={2}
          placeholder={t('type.placeholder')}
          accessibilityLabel={t('type.title')}
        />
        <AppText variant="label">{t('preview.phrases')}</AppText>
        <View style={[styles.chips, row]}>
          {quickPhrases.map((phrase) => (
            <Chip key={phrase.label} label={t(phrase.label)} onPress={() => setText(lang === 'ur' ? phrase.ur : phrase.en)} />
          ))}
        </View>
      </Card>

      <SignAvatarComponent signs={supportedSigns} />
      <SignSequenceCard signs={supportedSigns} unsupportedWords={unsupportedWords} />
    </Screen>
  );
}

const styles = themedStyles(() => ({
  content: { paddingTop: spacing.md },
  card: { gap: spacing.md },
  head: { alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, minHeight: 36 },
  chips: { flexWrap: 'wrap', gap: spacing.sm },
  save: { minHeight: 44, paddingHorizontal: spacing.md, borderColor: palette.line },
}));

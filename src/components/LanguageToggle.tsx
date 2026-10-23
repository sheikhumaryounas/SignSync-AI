import React from 'react';
import { SegmentedControl } from './ui';
import { UiLanguage, useI18n } from '../i18n';

// EN | اردو switch shown on every auth screen; changes the UI language immediately.
export function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <SegmentedControl<UiLanguage>
      size="sm"
      style={{ width: 116 }}
      accessibilityLabel="App language"
      value={lang}
      onChange={setLang}
      options={[
        { value: 'en', label: t('lang.en') },
        { value: 'ur', label: t('lang.ur'), urdu: true },
      ]}
    />
  );
}

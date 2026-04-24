import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, NativeModules, Platform } from 'react-native';

import en from './en.json';
import ar from './ar.json';

const deviceLanguage =
  Platform.OS === 'android'
    ? NativeModules.I18nManager?.localeIdentifier?.split('_')[0] ||
      NativeModules.SettingsManager?.settings?.AppleLocale?.split('_')[0] ||
      'en'
    : NativeModules.SettingsManager?.settings?.AppleLocale?.split('_')[0] || 'en';

const isArabic = deviceLanguage === 'ar';

if (isArabic) {
  I18nManager.forceRTL(true);
} else {
  I18nManager.forceRTL(false);
}

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: isArabic ? 'ar' : 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export const isRTL = isArabic;
export default i18n;

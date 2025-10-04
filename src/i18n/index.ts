// i18n.ts
import i18n, {Resource} from 'i18next';
import {initReactI18next} from 'react-i18next';
import {findBestLanguageTag} from 'react-native-localize';
import {I18nManager} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en_common from './locales/en/common.json';
import en_launch from './locales/en/launch.json';
import en_login from './locales/en/login.json';
import en_nav from './locales/en/nav.json';
import en_settings from './locales/en/settings.json';
import en_home from './locales/en/home.json';
import en_profile from './locales/en/profile.json';
import en_exercise from './locales/en/exercise.json';
import en_groups from './locales/en/groups.json';
import en_chat from './locales/en/chat.json';
import tr_common from './locales/tr/common.json';
import tr_launch from './locales/tr/launch.json';
import tr_login from './locales/tr/login.json';
import tr_nav from './locales/tr/nav.json';
import tr_settings from './locales/tr/settings.json';
import tr_home from './locales/tr/home.json';
import tr_profile from './locales/tr/profile.json';
import tr_exercise from './locales/tr/exercise.json';
import tr_groups from './locales/tr/groups.json';
import tr_chat from './locales/tr/chat.json';

const resources = {
  en: {
    common: en_common,
    launch: en_launch,
    login: en_login,
    nav: en_nav,
    settings: en_settings,
    home: en_home,
    profile: en_profile,
    exercise: en_exercise,
    groups: en_groups,
    chat: en_chat,
  },
  tr: {
    common: tr_common,
    launch: tr_launch,
    login: tr_login,
    nav: tr_nav,
    settings: tr_settings,
    home: tr_home,
    profile: tr_profile,
    exercise: tr_exercise,
    groups: tr_groups,
    chat: tr_chat,
  },
} as const;

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: (typeof resources)['en'];
  }
}

const STORAGE_KEY = 'app_language';

async function detectLanguage(): Promise<'tr' | 'en'> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  if (saved === 'tr' || saved === 'en') return saved;

  const supported = ['tr', 'en'];
  const best = findBestLanguageTag(supported);
  return (best?.languageTag.split('-')[0] as 'tr' | 'en') ?? 'en';
}

export async function initI18n() {
  const lng = await detectLanguage();

  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(lng);
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
  }

  await i18n.use(initReactI18next).init({
    resources: resources as unknown as Resource,
    lng,
    fallbackLng: 'en',
    ns: [
      'common',
      'launch',
      'login',
      'nav',
      'settings',
      'home',
      'profile',
      'exercise',
      'groups',
      'chat',
    ],
    interpolation: {escapeValue: false},
    returnObjects: false,
    defaultNS: 'common',
  });

  return i18n;
}

export async function changeLanguage(lang: 'tr' | 'en') {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(STORAGE_KEY, lang);
}

export default i18n;

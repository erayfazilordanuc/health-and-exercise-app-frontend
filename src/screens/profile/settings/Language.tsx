import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../../themes/ThemeProvider';
import {useTranslation} from 'react-i18next';
import {changeLanguage} from '../../../i18n';

const Language = () => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t, i18n} = useTranslation('settings'); // settings.language.title vs.
  const current = i18n.language as 'tr' | 'en';

  const setLang = async (lng: 'tr' | 'en') => {
    if (lng === current) return;
    await changeLanguage(lng); // i18n.changeLanguage + AsyncStorage yazıyor
    // RTL diller yok (tr/en) => I18nManager ayarı gerekmiyor
  };

  const Chip = ({code, label}: {code: 'tr' | 'en'; label: string}) => (
    <TouchableOpacity
      onPress={() => setLang(code)}
      className="px-4 py-2 mr-2 mt-2"
      style={{
        backgroundColor:
          current === code ? colors.primary[200] : colors.background.secondary,
        borderRadius: 12,
      }}>
      <Text
        className="font-rubik"
        style={{
          color: current === code ? '#fff' : colors.text.primary,
          fontSize: 16,
        }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
      className="h-full pb-32 px-3 pt-3"
      style={{backgroundColor: colors.background.secondary}}>
      <View
        className="flex flex-col px-4 py-3 rounded-2xl"
        style={{backgroundColor: colors.background.primary}}>
        <View className="flex-row flex-wrap">
          <Chip code="tr" label="Türkçe" />
          <Chip code="en" label="English" />
        </View>

        <Text
          className="mt-4 font-rubik"
          style={{color: colors.text.primary, opacity: 0.7}}>
          {current === 'tr'
            ? ' Seçili dil: Türkçe'
            : ' Selected language: English'}
        </Text>
      </View>
    </View>
  );
};

export default Language;

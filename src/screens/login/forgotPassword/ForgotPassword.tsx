import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../../../themes/ThemeProvider';
import {useTranslation} from 'react-i18next';
import axios from 'axios';
import {sendCode} from '../../../api/auth/authService';
import NetInfo from '@react-native-community/netinfo';

const ForgotPassword = () => {
  const navigation = useNavigation<RootScreenNavigationProp>();
  const {theme, colors} = useTheme();
  const {t} = useTranslation('login');
  const {t: c} = useTranslation('common');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      ToastAndroid.show(
        t('forgotPassword.toasts.emailRequired'),
        ToastAndroid.SHORT,
      );
      return;
    }

    const {isConnected} = await NetInfo.fetch();
    if (!isConnected)
      ToastAndroid.show(t('toasts.networkError'), ToastAndroid.LONG);

    setLoading(true);
    try {
      const dto: ForgotPasswordRequestDTO = {
        email: email.trim(),
      };

      const response = await sendCode(dto);
      if (response && response.status >= 200 && response.status < 400) {
        ToastAndroid.show(
          t('forgotPassword.toasts.sendCodeSuccess'),
          ToastAndroid.LONG,
        );
        navigation.navigate('VerifyCode', {email});
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        let message = error.response?.data?.message || error.message;

        if (status === 404) message = t('forgotPassword.toasts.userNotFound');
        else if (status === 502) message = t('toasts.serverError');
        else message = t('toasts.unexpectedError');

        ToastAndroid.show(message, ToastAndroid.SHORT);
      } else {
        ToastAndroid.show(t('toasts.unexpectedError'), ToastAndroid.SHORT);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      className="h-full"
      style={{backgroundColor: colors.background.secondary}}>
      {/* Arka plan gradyanı UserLogin ile aynı */}
      <LinearGradient
        colors={['#D7F4F7', '#EBEDFC', '#80CCFF', '#C4FFF4']}
        start={{x: 0.1, y: 0}}
        end={{x: 0.9, y: 1}}
        className="absolute inset-0"
      />
      <ScrollView
        contentContainerClassName="pt-32 pb-12"
        keyboardShouldPersistTaps="handled">
        <View className="px-10">
          <Text
            className="text-center font-rubik-bold mt-8 mb-8"
            style={{color: '#404040', fontSize: 40}}>
            {c('app.name')}
          </Text>
          <Text
            className="text-3xl font-rubik-semibold text-center mt-6 mb-2"
            style={{color: '#404040'}}>
            {t('forgotPassword.title')}
          </Text>
          <Text
            className="text-lg font-rubik text-center mb-6"
            style={{color: '#505050'}}>
            {t('forgotPassword.instruction')}
          </Text>

          <View
            className="flex flex-row items-center justify-start z-50 rounded-full mt-2 py-1"
            style={{
              backgroundColor: theme.colors.isLight
                ? colors.background.primary
                : '#333333',
            }}>
            <TextInput
              placeholderTextColor={'gray'}
              selectionColor={'#7AADFF'}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder={t('forgotPassword.form.email')}
              className="text-lg font-rubik ml-5 flex-1"
              style={{color: colors.text.primary}}
            />
          </View>

          <View className="flex flex-row justify-center">
            <TouchableOpacity
              onPress={handleSendCode}
              className="shadow-md shadow-zinc-350 rounded-full w-full py-3 mt-4"
              style={{
                backgroundColor: theme.colors.isLight
                  ? colors.background.primary
                  : '#333333',
              }}>
              {!loading ? (
                <Text
                  className="text-xl font-rubik text-center py-1"
                  style={{color: colors.text.primary}}>
                  {t('forgotPassword.buttons.sendResetLink')}
                </Text>
              ) : (
                <ActivityIndicator
                  className=""
                  size="large"
                  color={colors.text.secondary}
                />
              )}
            </TouchableOpacity>
          </View>

          <View className="items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mt-8">
              <Text
                className="text-xl font-rubik text-center"
                style={{color: '#0091ff', textDecorationLine: 'underline'}}>
                {t('forgotPassword.links.backToLogin')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ForgotPassword;

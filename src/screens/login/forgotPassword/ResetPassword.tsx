import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  ToastAndroid,
  Image,
  BackHandler,
} from 'react-native';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../../../themes/ThemeProvider';
import {useTranslation} from 'react-i18next';
import axios from 'axios';
import icons from '../../../constants/icons';
import {changePassword} from '../../../api/auth/authService';
import CustomAlert from '../../../components/CustomAlert';
import {useUser} from '../../../contexts/UserContext';
import NetInfo from '@react-native-community/netinfo';

type ResetPasswordRouteProp = RouteProp<AppStackParamList, 'ResetPassword'>;

const ResetPassword = () => {
  const navigation = useNavigation<RootScreenNavigationProp>();
  const {theme, colors} = useTheme();
  const {t} = useTranslation('login');
  const {t: c} = useTranslation('common');

  const {params} = useRoute<ResetPasswordRouteProp>();
  const {token} = params;

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const {setUser} = useUser();

  const handleResetPassword = async () => {
    if (!password.trim()) {
      ToastAndroid.show(
        t('forgotPassword.toasts.passwordRequired'),
        ToastAndroid.SHORT,
      );
      return;
    }

    const {isConnected} = await NetInfo.fetch();
    if (!isConnected)
      ToastAndroid.show(t('toasts.networkError'), ToastAndroid.LONG);

    setLoading(true);
    try {
      const dto: NewPasswordDTO = {
        password,
      };
      console.log('dto to change password', dto);
      const response = await changePassword(dto, token);
      if (response && response.status >= 200 && response.status < 400) {
        ToastAndroid.show(
          t('forgotPassword.toasts.passwordChangeSuccess'),
          ToastAndroid.LONG,
        );
        const user = response.data as User;
        setUser(user);
        navigation.navigate('App');
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

  const [backAlertVisible, setBackAlertVisible] = useState(false);
  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        setBackAlertVisible(true);
        return true;
      };
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );
      return () => backHandler.remove();
    }, []),
  );

  return (
    <SafeAreaView
      className="h-full"
      style={{backgroundColor: colors.background.secondary}}>
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
            {t('forgotPassword.resetPasswordTitle')}
          </Text>
          <Text
            className="text-lg font-rubik text-center mb-6"
            style={{color: '#505050'}}>
            {t('forgotPassword.resetPasswordInstruction')}
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
              value={password}
              onChangeText={(value: string) => {
                setPassword(value);
              }}
              placeholder={t('forgotPassword.form.newPassword')}
              className="text-lg font-rubik ml-6 flex-1"
              style={{color: colors.text.primary}}
              secureTextEntry={!showPassword}
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-5">
              <Image
                source={showPassword ? icons.show : icons.hide}
                className="size-6 mr-2"
                tintColor={'gray'}
              />
            </TouchableOpacity>
          </View>

          <View className="flex flex-row justify-center">
            <TouchableOpacity
              onPress={handleResetPassword}
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
                  {t('forgotPassword.buttons.confirm')}
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
              onPress={() => setBackAlertVisible(true)}
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

      <CustomAlert
        message={t('forgotPassword.confirmExit.message')}
        visible={backAlertVisible}
        onYes={() => {
          navigation.goBack();
          setBackAlertVisible(false);
        }}
        onCancel={() => setBackAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

export default ResetPassword;

import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ToastAndroid,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  BackHandler,
  Modal,
  Dimensions,
} from 'react-native';
import {
  CommonActions,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import {useCallback, useEffect, useMemo, useState} from 'react';
import icons from '../../../constants/icons';
import {SafeAreaView} from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNetInfo} from '@react-native-community/netinfo';
import {useTheme} from '../../../themes/ThemeProvider';
import {
  login,
  loginAdmin,
  register,
  registerAdmin,
} from '../../../api/auth/authService';
import {useUser} from '../../../contexts/UserContext';
import DatePicker from 'react-native-date-picker';
import {Dropdown} from 'react-native-element-dropdown';
import {BlurView} from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import {LoginMethod} from '../../../types/enums';
import {useTranslation} from 'react-i18next';

function AdminLogin() {
  const {t} = useTranslation(['login', 'common']);

  const navigation = useNavigation<RootScreenNavigationProp>();
  const {theme, colors, setTheme} = useTheme();
  const {height} = Dimensions.get('screen');
  const netInfo = useNetInfo();
  const [loading, setLoading] = useState(false);

  const [loginMethod, setLoginMethod] = useState<LoginMethod>(
    LoginMethod.default,
  );

  const {setUser} = useUser();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [date, setDate] = useState<Date>(new Date(2000, 0, 2));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  const [isCodeStep, setIsCodeStep] = useState(false);

  const [kvkkApproved, setKvkkApproved] = useState(false);
  const [kvkkModalVisible, setKvkkModalVisible] = useState(false);

  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const clearInputs = () => {
    setUsername('');
    setPassword('');
  };

  const fiveYearsAgo = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 5);
    return d; // 5 yıl önce bugün
  }, []);

  const handleGoogleLogin = async () => {};

  const handleLogin = async () => {
    try {
      setLoading(true);

      if (!(username && password)) {
        ToastAndroid.show(t('login:toasts.fillAllFields'), ToastAndroid.SHORT);
        return;
      }

      if (isCodeStep && !code) {
        ToastAndroid.show(t('login:toasts.codeRequired'), ToastAndroid.SHORT);
        return;
      }

      const loginPayload: LoginRequestPayload = {
        username: username.trim(),
        password: password.trim(),
      };

      const requestPayload: AdminLoginRequestPayload = {
        loginDTO: loginPayload,
        code: code,
      };

      const loginResponse = await loginAdmin(requestPayload);
      setLoading(false);

      if (loginResponse && loginResponse.status === 200) {
        if (!loginResponse.data) {
          setIsCodeStep(true);
          ToastAndroid.show(t('login:toasts.emailSent'), ToastAndroid.SHORT);
        } else {
          const user = loginResponse.data.userDTO as User;
          setUser(user);
          navigation.navigate('App');
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{name: 'App'}],
            }),
          );
        }
      }
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        let message = error.response?.data?.message || error.message;

        if (status === 403 || status === 500)
          message = t('login:toasts.wrongCredentials');
        if (status === 502) message = t('login:toasts.serverError');
        ToastAndroid.show(
          message || t('login:toasts.serverError'),
          ToastAndroid.SHORT,
        );
      } else if (error instanceof Error) {
        const maybeStatus = (error as any).status;
        if (maybeStatus === 403 || maybeStatus === 500) {
          ToastAndroid.show(
            t('login:toasts.wrongCredentials'),
            ToastAndroid.SHORT,
          );
          return;
        }
        ToastAndroid.show(t('login:toasts.unexpectedError'), ToastAndroid.LONG);
      } else {
        ToastAndroid.show(
          t('login:toasts.unexpectedError'),
          ToastAndroid.SHORT,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      setLoading(true);

      if (!(username && email && fullName && password)) {
        ToastAndroid.show(t('login:toasts.fillAllFields'), ToastAndroid.SHORT);
        return;
      }

      if (fullName.split(' ').length < 2) {
        ToastAndroid.show(t('login:toasts.invalidFullName'), ToastAndroid.LONG);
        return;
      }

      if (!emailRegex.test(email.trim())) {
        ToastAndroid.show(t('login:toasts.invalidEmail'), ToastAndroid.SHORT);
        return;
      }

      if (username.length < 4) {
        ToastAndroid.show(t('login:toasts.usernameMin'), ToastAndroid.SHORT);
        return;
      }

      if (username.length > 25) {
        ToastAndroid.show(t('login:toasts.usernameMax'), ToastAndroid.SHORT);
        return;
      }

      if (password.length < 8) {
        ToastAndroid.show(t('login:toasts.passwordMin'), ToastAndroid.SHORT);
        return;
      }

      if (isCodeStep && !code) {
        ToastAndroid.show(t('login:toasts.codeRequired'), ToastAndroid.SHORT);
        return;
      }

      const registerPayload: RegisterRequestPayload = {
        username: username.trim(),
        email: email.trim(),
        fullName: fullName.trim(),
        birthDate: birthDate,
        password: password.trim(),
        gender: gender,
        theme: 'blueSystem',
      };

      const requestPayload: AdminRegisterRequestPayload = {
        registerDTO: registerPayload,
        code: code,
      };

      const registerResponse = await registerAdmin(requestPayload);
      setLoading(false);

      if (registerResponse && registerResponse.status === 200) {
        if (!registerResponse.data) {
          setIsCodeStep(true);
          ToastAndroid.show(t('login:toasts.emailSent'), ToastAndroid.SHORT);
        } else {
          const user = registerResponse.data.userDTO as User;
          setUser(user);
          navigation.navigate('App');
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{name: 'App'}],
            }),
          );
        }
      }
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        let message = error.response?.data?.message || error.message;

        if (status === 500) message = t('login:toasts.usernameTaken');
        if (status === 502) message = t('login:toasts.serverError');
        if (status?.toString().startsWith('4'))
          message = t('login:toasts.nurseNotFound');
        ToastAndroid.show(
          message || t('login:toasts.serverError'),
          ToastAndroid.SHORT,
        );
      } else if (error instanceof Error) {
        ToastAndroid.show(
          t('login:toasts.unexpectedError'),
          ToastAndroid.SHORT,
        );
      } else {
        ToastAndroid.show(
          t('login:toasts.unexpectedError'),
          ToastAndroid.SHORT,
        );
      }
    } finally {
      setLoading(false);
    }
  };

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
        className={`px-10`}
        style={{
          marginTop:
            loginMethod === LoginMethod.registration
              ? isCodeStep
                ? 0
                : 40
              : 96,
        }}
        keyboardShouldPersistTaps>
        <Text
          className="text-center font-rubik-bold mt-8 mb-8"
          style={{
            color: '#404040',
            fontSize: 40,
          }}>
          {t('app.name', {ns: 'common'})} {/* "HopeMove" */}
        </Text>
        <Text
          className="text-3xl font-rubik-semibold text-center mt-6 mb-4"
          style={{color: '#404040'}}>
          {t('login:title', {role: t('common:roles.admin')})}{' '}
        </Text>

        {loginMethod === LoginMethod.registration && (
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
              value={fullName}
              onChangeText={(value: string) => {
                setFullName(value);
              }}
              placeholder={t('form.fullName')} // "Ad Soyad"
              className="text-lg font-rubik ml-5 flex-1"
              style={{color: colors.text.primary}}
            />
          </View>
        )}
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
            value={username}
            onChangeText={(value: string) => {
              setUsername(value);
            }}
            placeholder={t('form.username')} // "Kullanıcı adı"
            className="text-lg font-rubik ml-5 flex-1"
            style={{color: colors.text.primary}}
          />
        </View>
        {loginMethod === LoginMethod.registration && (
          <>
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
                value={email}
                onChangeText={(value: string) => {
                  setEmail(value);
                }}
                placeholder={t('form.email')} // "E-posta"
                className="text-lg font-rubik ml-5 flex-1"
                style={{color: colors.text.primary}}
              />
            </View>
            <View
              className="flex flex-row items-center justify-start z-50 rounded-full mt-2 py-1"
              style={{
                borderColor: '#7AADFF',
                backgroundColor: theme.colors.isLight
                  ? colors.background.primary
                  : '#333333',
              }}>
              <Text
                className="text-lg font-rubik ml-6 py-3 flex-1"
                style={{color: birthDate ? colors.text.primary : 'gray'}}>
                {
                  birthDate
                    ? new Date(birthDate).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : t('form.birthDate') /* "Doğum Tarihi" */
                }
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowDatePicker(true);
                }}
                className="p-2 rounded-2xl mr-4"
                style={{backgroundColor: colors.background.secondary}}>
                <Image
                  source={icons.calendar}
                  className="size-8"
                  tintColor={colors.text.primary}
                />
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DatePicker
                modal
                locale={t('datepicker.locale')}
                mode="date"
                title={t('datepicker.title')} // "Tarih Seçin"
                confirmText={t('datepicker.confirm')} // "Tamam"
                cancelText={t('datepicker.cancel')} // "İptal"
                open={showDatePicker}
                date={date}
                maximumDate={fiveYearsAgo} // 5 yıldan küçük seçilemez
                minimumDate={new Date(1950, 0, 1)} // 1950 öncesi seçilemez
                onConfirm={d => {
                  setShowDatePicker(false);
                  setDate(d);
                  setBirthDate(d.toISOString().slice(0, 10));
                }}
                onCancel={() => setShowDatePicker(false)}
              />
            )}
            <View
              className="z-50 mt-2"
              style={{
                backgroundColor: theme.colors.isLight
                  ? colors.background.primary
                  : '#333333',
                borderRadius: 25,
                paddingHorizontal: 22,
                zIndex: 3000,
              }}>
              <Dropdown
                data={[
                  {
                    label: t('form.genderOptions.female'),
                    value: 'female',
                  },
                  {
                    label: t('form.genderOptions.male'),
                    value: 'male',
                  },
                ]}
                labelField="label"
                valueField="value"
                placeholder={t('form.gender')} // "Cinsiyet"
                value={gender}
                onChange={item => setGender(item.value)}
                style={{
                  backgroundColor: 'transparent',
                  height: 52,
                }}
                placeholderStyle={{
                  color: 'gray',
                  fontSize: 16,
                  fontFamily: 'Rubik',
                }}
                selectedTextStyle={{
                  color: colors.text.primary,
                  fontSize: 16,
                }}
                itemTextStyle={{
                  color: colors.text.primary,
                }}
                containerStyle={{
                  borderRadius: 20,
                  borderColor: 'gray',
                  backgroundColor: theme.colors.isLight
                    ? colors.background.primary
                    : '#333333',
                }}
                activeColor={colors.primary?.[100] ?? '#D6EFFF'}
              />
            </View>
          </>
        )}
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
            placeholder={t('form.password')} // "Şifre"
            className="text-lg font-rubik ml-5 flex-1"
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
        {isCodeStep && (
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
              value={code ? code : ''}
              maxLength={6}
              onChangeText={(value: string) => {
                setCode(value);
              }}
              placeholder={t('form.code')} // "Doğrulama Kodu"
              className="text-lg font-rubik ml-5 flex-1"
              style={{color: colors.text.primary}}
            />
          </View>
        )}

        {loginMethod !== LoginMethod.registration && (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('ForgotPassword');
            }}>
            <Text
              className="text-lg font-rubik text-center mt-2"
              style={{color: '#0091ff', textDecorationLine: 'underline'}}>
              {t('login:forgotPassword.title')}
            </Text>
          </TouchableOpacity>
        )}

        {!loading ? (
          <View className="flex flex-row justify-center">
            {loginMethod === LoginMethod.default && (
              <TouchableOpacity
                onPress={handleLogin}
                className="shadow-md shadow-zinc-350 rounded-3xl w-1/2 py-2 mt-3"
                style={{
                  backgroundColor: theme.colors.isLight
                    ? colors.background.primary
                    : '#333333',
                }}>
                <Text
                  className="text-xl font-rubik text-center py-1"
                  style={{color: colors.text.primary}}>
                  {t('buttons.signIn')} {/* "Giriş Yap" */}
                </Text>
              </TouchableOpacity>
            )}
            {loginMethod === LoginMethod.registration && (
              <TouchableOpacity
                onPress={() => {
                  handleCreateAccount();
                }}
                className="shadow-md shadow-zinc-350 rounded-full w-1/2 py-3 mt-3"
                style={{
                  backgroundColor: theme.colors.isLight
                    ? colors.background.primary
                    : '#333333',
                }}>
                <Text
                  className="text-xl font-rubik text-center py-1"
                  style={{color: colors.text.primary}}>
                  {t('buttons.createAccount')} {/* "Hesap Oluştur" */}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <ActivityIndicator
            className="mt-5 mb-2"
            size="large"
            color={colors.primary[300] ?? colors.primary}
          />
        )}

        {loginMethod !== LoginMethod.default && (
          <Text
            className="text-lg font-rubik text-center mt-4"
            style={{color: colors.text.third}}>
            {t('links.haveAccount')} {'\n'}
            <TouchableOpacity
              onPress={() => {
                clearInputs();
                setLoginMethod(LoginMethod.default);
              }}>
              <Text
                className="text-xl font-rubik text-center"
                style={{color: '#0091ff', textDecorationLine: 'underline'}}>
                {t('buttons.signIn')}
              </Text>
            </TouchableOpacity>
          </Text>
        )}
        {loginMethod !== LoginMethod.registration && (
          <Text
            className="text-lg font-rubik text-center mt-4"
            style={{color: colors.text.third}}>
            {t('links.noAccount')}
            {'\n'}
            <TouchableOpacity
              onPress={() => {
                clearInputs();
                setLoginMethod(LoginMethod.registration);
              }}>
              <Text
                className="text-xl font-rubik text-center"
                style={{color: '#0091ff', textDecorationLine: 'underline'}}>
                {t('buttons.createAccount')}
              </Text>
            </TouchableOpacity>
          </Text>
        )}
      </ScrollView>

      {/* <Modal
        transparent
        visible={kvkkModalVisible}
        animationType="fade"
        onRequestClose={() => setKvkkModalVisible(false)}>
        <View className="flex-1 justify-center items-center bg-black/40">
          <View
            style={{
              width: '91%',
              maxHeight: height * 0.7,
              borderRadius: 24,
              padding: 20,
              backgroundColor: colors.background.primary,
            }}>
            <ScrollView
              style={{flexGrow: 1}}
              contentContainerStyle={{paddingBottom: 8}}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled>
              <Text
                style={{
                  marginTop: 15,
                  fontSize: 13,
                  lineHeight: 20,
                  textAlign: 'center',
                }}
                className="font-rubik">
                Telefonunuzdaki sağlık verilerini HopeMove uygulamasından takip
                etmek için{' '}
                <Text className="font-rubik-medium">Health Connect</Text> ve
                <Text className="font-rubik-medium"> Google Fit</Text>{' '}
                uygulamalarını indirmeniz gerekiyor...
              </Text>
            </ScrollView>

            <View
              className="flex flex-row justify-between mt-5"
              style={{flexShrink: 0}}>
              <TouchableOpacity
                onPress={() => {
                  setKvkkApproved(false);
                  setKvkkModalVisible(false);
                }}
                className="py-3 px-5 rounded-2xl items-center mx-2"
                style={{backgroundColor: colors.background.secondary}}>
                <Text
                  className="font-rubik text-lg"
                  style={{color: colors.text.primary}}>
                  {t('consents.reject')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="py-3 px-5 rounded-2xl items-center mx-2"
                style={{backgroundColor: colors.primary[200]}}
                onPress={() => {
                  setKvkkApproved(true);
                  setKvkkModalVisible(false);
                }}>
                <Text className="font-rubik text-lg text-white">
                  {t('consents.approve')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal> */}

      <View className="flex-1 ">
        <Text className="text-center absolute bottom-6 self-center text-sm text-gray-400">
          {t('footer.nurseApplication')}
          {'\n'}
        </Text>
        <Text className="text-center absolute bottom-6 self-center text-sm text-gray-400 underline">
          {t('footer.contactEmail')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
export default AdminLogin;

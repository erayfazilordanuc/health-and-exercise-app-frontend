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
  BackHandler,
  ImageBackground,
  Modal,
  Dimensions,
  useColorScheme,
} from 'react-native';
import {
  CommonActions,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import {useCallback, useEffect, useMemo, useState} from 'react';
import icons from '../../constants/icons';
import {SafeAreaView} from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNetInfo} from '@react-native-community/netinfo';
import {useTheme} from '../../themes/ThemeProvider';
import {login, register} from '../../api/auth/authService';
import {useUser} from '../../contexts/UserContext';
import {Picker} from '@react-native-picker/picker';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {Dropdown} from 'react-native-element-dropdown';
import DatePicker from 'react-native-date-picker';
import {BlurView} from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import {CustomModal} from '../../components/CustomModal';
import {getLatestPolicy, giveConsent} from '../../api/consent/consentService';
import {
  ConsentPolicyPurpose,
  ConsentPurpose,
  ConsentStatus,
  LoginMethod,
} from '../../types/enums';
import {ConsentModal} from '../../components/ConsentModal';
import {parseTheme} from '../../themes/themes';
import NetInfo from '@react-native-community/netinfo';
import {useTranslation} from 'react-i18next'; // <-- i18n eklendi

function UserLogin() {
  const navigation = useNavigation<RootScreenNavigationProp>();
  const {theme, colors, setTheme} = useTheme();
  const colorScheme = useColorScheme();
  const {height} = Dimensions.get('screen');
  const netInfo = useNetInfo();
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(
    LoginMethod.default,
  );
  const {t} = useTranslation(['login', 'common']); // <-- i18n namespace'leri
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

  const [kvkkPolicy, setKvkkPolicy] = useState<ConsentPolicyDTO | null>(null);
  const [healthPolicy, setHealthPolicy] = useState<ConsentPolicyDTO | null>(
    null,
  );
  const [exercisePolicy, setExercisePolicy] = useState<ConsentPolicyDTO | null>(
    null,
  );
  const [studyPolicy, setStudyPolicy] = useState<ConsentPolicyDTO | null>(null);

  const [consentModalVisible, setConsentModalVisible] = useState(false);
  const [studyModalVisible, setStudyModalVisible] = useState(false);

  const [kvkkAcknowledged, setKvkkAcknowledged] = useState(false);
  const [healthDataApproved, setHealthDataApproved] = useState(false);
  const [exerciseDataApproved, setExerciseDataApproved] = useState(false);
  const [studyApproved, setStudyApproved] = useState(false);

  const [scrolledToEnd, setScrolledToEnd] = useState(false);

  function handleScroll(e: any) {
    const {layoutMeasurement, contentOffset, contentSize} = e.nativeEvent;
    const isEnd =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    if (isEnd) setScrolledToEnd(true);
  }

  // FOOTER metnini i18n'den alıyoruz ki stripFooter aynı şekilde çalışsın
  const FOOTER = t('login:consents.footer');

  function stripFooter(text?: string) {
    if (!text) return '';
    return text.trim().endsWith(FOOTER)
      ? text.trim().slice(0, -FOOTER.length).trim()
      : text.trim();
  }

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
        // Alert
        ToastAndroid.show(t('login:toasts.fillAllFields'), ToastAndroid.SHORT);
        return;
      }

      const loginPayload: LoginRequestPayload = {
        username: username.trim(),
        password: password.trim(),
      };

      const loginResponse = await login(loginPayload);
      setLoading(false);

      if (loginResponse && loginResponse.status === 200 && loginResponse.data) {
        const user = loginResponse.data.userDTO as User;
        setUser(user);
        if (user.theme) {
          const {color, mode, themeObj} = parseTheme(user.theme);
          if (color && themeObj) {
            if (mode === 'system') {
              setTheme(colorScheme === 'dark' ? themeObj.dark : themeObj.light);
            } else {
              setTheme(mode === 'dark' ? themeObj.dark : themeObj.light);
            }
          }
        }
        navigation.navigate('App');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'App'}],
          }),
        );
      }
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        let message = error.response?.data?.message || error.message;

        if (status === 500) message = t('login:toasts.loginNurseUsername'); // "Bu kullanıcı adı bir hemşireye ait"
        if (status === 403) message = t('login:toasts.wrongCredentials');
        if (status === 502) message = t('login:toasts.serverError');
        ToastAndroid.show(
          message || t('login:toasts.serverError'),
          ToastAndroid.SHORT,
        );
      } else if (error instanceof Error) {
        if (error.message === 'Network Error') {
          ToastAndroid.show(t('login:toasts.networkError'), ToastAndroid.SHORT);
          return;
        }

        const maybeStatus = (error as any).status;
        if (maybeStatus === 403 || maybeStatus === 500) {
          ToastAndroid.show(
            t('login:toasts.wrongCredentials'),
            ToastAndroid.SHORT,
          );
          return;
        }
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

  const handleCreateAccount = async () => {
    try {
      setLoading(true);

      if (
        !(fullName && username && fullName && password && gender && birthDate)
      ) {
        ToastAndroid.show(t('login:toasts.fillAllFields'), ToastAndroid.SHORT);
        return;
      }

      // if (!usernameRegex.test(username)) {
      //   ToastAndroid.show(t('login:toasts.invalidUsernameFormat'), ToastAndroid.SHORT);
      //   return;
      // }

      if (fullName.split('login: ').length < 2) {
        ToastAndroid.show(t('login:toasts.invalidFullName'), ToastAndroid.LONG);
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

      if (date > fiveYearsAgo) {
        ToastAndroid.show(
          t('login:toasts.invalidBirthDate'),
          ToastAndroid.SHORT,
        );
        return;
      }

      if (
        !kvkkAcknowledged ||
        !healthDataApproved ||
        !exerciseDataApproved ||
        !studyApproved
      ) {
        ToastAndroid.show(
          t('login:toasts.consentsRequired'),
          ToastAndroid.LONG,
        );
        return;
      }

      const registerPayload: RegisterRequestPayload = {
        username: username.trim(),
        // email: 'ostensible@gmail.com',
        fullName: fullName.trim(),
        birthDate: birthDate,
        password: password.trim(),
        gender: gender,
        theme: 'blueSystem',
      };
      const registerResponse = await register(registerPayload);

      if (
        registerResponse &&
        registerResponse.status === 200 &&
        registerResponse.data
      ) {
        const user = registerResponse.data.userDTO as User;
        const kvkkConsent: UpsertConsentDTO = {
          purpose: ConsentPurpose['KVKK_NOTICE_ACK'],
          status: kvkkAcknowledged
            ? ConsentStatus['ACKNOWLEDGED']
            : ConsentStatus['REJECTED'],
          policyId: kvkkPolicy?.id!,
          locale: t('common:locale'),
          source: 'MOBILE',
        };
        const kvkkResponse = await giveConsent(kvkkConsent);

        const healthDataConsent: UpsertConsentDTO = {
          purpose: ConsentPurpose['HEALTH_DATA_PROCESSING_ACK'],
          status: healthDataApproved
            ? ConsentStatus['ACCEPTED']
            : ConsentStatus['REJECTED'],
          policyId: healthPolicy?.id!,
          locale: t('common:locale'),
          source: 'MOBILE',
        };
        const healthDataResponse = await giveConsent(healthDataConsent);

        const exerciseDataConsent: UpsertConsentDTO = {
          purpose: ConsentPurpose['EXERCISE_DATA_PROCESSING_ACK'],
          status: exerciseDataApproved
            ? ConsentStatus['ACCEPTED']
            : ConsentStatus['REJECTED'],
          policyId: exercisePolicy?.id!,
          locale: t('common:locale'),
          source: 'MOBILE',
        };
        const exerciseDataResponse = await giveConsent(exerciseDataConsent);

        const studyConsent: UpsertConsentDTO = {
          purpose: ConsentPurpose['STUDY_CONSENT_ACK'],
          status: studyApproved
            ? ConsentStatus['ACCEPTED']
            : ConsentStatus['REJECTED'],
          policyId: studyPolicy?.id!,
          locale: t('common:locale'),
          source: 'MOBILE',
        };
        const studyResponse = await giveConsent(studyConsent);

        setUser(user);

        setLoading(false);
        navigation.navigate('App');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'App'}],
          }),
        );
      }
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        let message = error.response?.data?.message || error.message;

        if (status === 500) message = t('login:toasts.usernameTaken');
        if (status === 502) message = t('login:toasts.serverError');
        ToastAndroid.show(
          message || t('login:toasts.serverError'),
          ToastAndroid.SHORT,
        );
      } else if (error instanceof Error) {
        if (error.message === 'Network Error') {
          ToastAndroid.show(t('login:toasts.networkError'), ToastAndroid.SHORT);
          return;
        }

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

  const fetchConsentPolicies = async () => {
    const kvkk = await getLatestPolicy(
      ConsentPolicyPurpose['KVKK_NOTICE'],
      t('common:locale'),
    );
    setKvkkPolicy(kvkk);

    const health = await getLatestPolicy(
      ConsentPolicyPurpose['HEALTH_DATA_PROCESSING'],
      t('common:locale'),
    );
    setHealthPolicy(health);

    const exercise = await getLatestPolicy(
      ConsentPolicyPurpose['EXERCISE_DATA_PROCESSING'],
      t('common:locale'),
    );
    setExercisePolicy(exercise);

    const study = await getLatestPolicy(
      ConsentPolicyPurpose['STUDY_CONSENT'],
      t('common:locale'),
    );
    setStudyPolicy(study);
  };

  useEffect(() => {
    console.log('burada');
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        if (loginMethod === LoginMethod.registration) fetchConsentPolicies();
      } else {
        ToastAndroid.show(
          t('login:toasts.noInternetForPolicies'),
          ToastAndroid.LONG,
        );
      }
    });

    return () => {
      unsubscribe(); // cleanup
    };
  }, [loginMethod]);

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
        contentContainerClassName={`pb-12 ${
          loginMethod === LoginMethod.registration ? 'pt-4' : 'pt-32'
        }`}
        keyboardShouldPersistTaps>
        <View className={`px-10`}>
          <Text
            className="text-center font-rubik-bold mt-8 mb-8"
            style={{color: '#404040', fontSize: 40}}>
            {t('common:app.name')}
          </Text>
          <Text
            className="text-3xl font-rubik-semibold text-center mt-6 mb-4"
            style={{color: '#404040'}}>
            {t('login:title', {
              role: t('common:roles.admin'),
            })}
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
                placeholder={t('login:form.fullName')}
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
              placeholder={t('login:form.username')}
              className="text-lg font-rubik ml-5 flex-1"
              style={{color: colors.text.primary}}
            />
          </View>
          {loginMethod === LoginMethod.registration && (
            <>
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
                  {birthDate
                    ? new Date(birthDate).toLocaleDateString(
                        t('common:locale'),
                        {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        },
                      )
                    : t('login:form.birthDate')}
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
                  locale={t('login:datepicker.locale')}
                  mode="date"
                  title={t('login:datepicker.title')}
                  confirmText={t('login:datepicker.confirm')}
                  cancelText={t('login:datepicker.cancel')}
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
                      label: t('login:form.genderOptions.female'),
                      value: 'female',
                    },
                    {label: t('login:form.genderOptions.male'), value: 'male'},
                  ]}
                  labelField="label"
                  valueField="value"
                  placeholder={t('login:form.gender')}
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
              placeholder={t('login:form.password')}
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
          {loginMethod === LoginMethod.registration && (
            <View className="flex flex-col">
              <TouchableOpacity
                className="mt-2 flex flex-row self-center items-center justify-between p-3 rounded-3xl"
                style={{backgroundColor: colors.background.primary}}
                onPress={() => setConsentModalVisible(true)}>
                <Text
                  className="ml-2 font-rubik text-md mr-3"
                  style={{color: colors.text.primary}}>
                  {t('login:consents.kvkkAndExplicit')}
                </Text>
                <Image
                  source={
                    kvkkAcknowledged &&
                    healthDataApproved &&
                    exerciseDataApproved
                      ? icons.checkbox_checked
                      : icons.checkbox_empty
                  }
                  className="size-6 mr-2"
                  tintColor={colors.text.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                className="mt-2 flex flex-row self-center items-center justify-between p-3 rounded-3xl"
                style={{backgroundColor: colors.background.primary}}
                onPress={() => setStudyModalVisible(true)}>
                <Text
                  className="ml-2 font-rubik text-md mr-3"
                  style={{color: colors.text.primary}}>
                  {t('login:consents.studyConsent')}
                </Text>
                <Image
                  source={
                    studyApproved
                      ? icons.checkbox_checked
                      : icons.checkbox_empty
                  }
                  className="size-6 mr-2"
                  tintColor={colors.text.primary}
                />
              </TouchableOpacity>
            </View>
          )}
          {!loading ? (
            <View className="flex flex-row justify-center">
              {loginMethod === LoginMethod.default && (
                <TouchableOpacity
                  onPress={handleLogin}
                  className="shadow-md shadow-zinc-350 rounded-full w-1/2 py-3 mt-3"
                  style={{
                    backgroundColor: theme.colors.isLight
                      ? colors.background.primary
                      : '#333333',
                  }}>
                  <Text
                    className="text-xl font-rubik text-center py-1"
                    style={{color: colors.text.primary}}>
                    {t('login:buttons.signIn')}
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
                    {t('login:buttons.createAccount')}
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
              {t('login:links.haveAccount')} {'\n'}
              <TouchableOpacity
                onPress={() => {
                  clearInputs();
                  setLoginMethod(LoginMethod.default);
                }}>
                <Text
                  className="text-xl font-rubik text-center"
                  style={{color: '#0091ff', textDecorationLine: 'underline'}}>
                  {t('login:buttons.signIn')}
                </Text>
              </TouchableOpacity>
            </Text>
          )}
          {loginMethod !== LoginMethod.registration && (
            <Text
              className="text-lg font-rubik text-center mt-4"
              style={{color: colors.text.third}}>
              {t('login:links.noAccount')}
              {'\n'}
              <TouchableOpacity
                onPress={() => {
                  clearInputs();
                  setLoginMethod(LoginMethod.registration);
                }}>
                <Text
                  className="text-xl font-rubik text-center"
                  style={{color: '#0091ff', textDecorationLine: 'underline'}}>
                  {t('login:buttons.createAccount')}
                </Text>
              </TouchableOpacity>
            </Text>
          )}
          {/* Google ile devam et örneği i18n'e taşınabilir */}
        </View>
      </ScrollView>

      <ConsentModal
        visible={consentModalVisible}
        requireScrollToEnd
        approveHint={t('login:consents.approveHint')}
        onApprove={() => {
          setKvkkAcknowledged(true);
          setHealthDataApproved(true);
          setExerciseDataApproved(true);
          setConsentModalVisible(false);
        }}
        onDecline={() => {
          setKvkkAcknowledged(false);
          setHealthDataApproved(false);
          setExerciseDataApproved(false);
          setConsentModalVisible(false);
        }}
        onApproveText={t('login:consents.approve')}
        onDeclineText={t('login:consents.reject')}
        body={
          <>
            <Text
              className="font-rubik text-md"
              style={{color: colors.text.primary}}>
              {stripFooter(kvkkPolicy?.content)}
              {'\n\n'}
              {stripFooter(healthPolicy?.content)}
              {'\n\n'}
              {stripFooter(exercisePolicy?.content)}
              {'\n\n\n'}
              {FOOTER}
            </Text>
          </>
        }
      />
      <ConsentModal
        visible={studyModalVisible}
        requireScrollToEnd
        approveHint={t('login:consents.approveHint')}
        onApprove={() => {
          setStudyApproved(true);
          setStudyModalVisible(false);
        }}
        onDecline={() => {
          setStudyApproved(false);
          setStudyModalVisible(false);
        }}
        onApproveText={t('login:consents.approve')}
        onDeclineText={t('login:consents.reject')}
        body={
          <Text
            className="font-rubik text-md"
            style={{color: colors.text.primary}}>
            {studyPolicy?.content}
          </Text>
        }
      />
    </SafeAreaView>
  );
}
export default UserLogin;

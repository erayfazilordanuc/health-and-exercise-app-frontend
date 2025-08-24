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

function UserLogin() {
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
  const [date, setDate] = useState<Date>(new Date());
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

  const FOOTER =
    'Rızamı dilediğim an, Profil > Ayarlar > İzinler ve Onaylar alanından geri çekebileceğimi biliyorum.';

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
        ToastAndroid.show('Lütfen tüm alanları doldurunuz', ToastAndroid.SHORT);
        return;
      }

      const loginPayload: LoginRequestPayload = {
        username: username.trim(),
        password: password.trim(),
      };

      const loginResponse = await login(loginPayload);
      // TO DO burada hata kodlarına göre hata mesajları eklenbilir
      setLoading(false);

      if (loginResponse && loginResponse.status === 200 && loginResponse.data) {
        const user = loginResponse.data.userDTO as User;
        setUser(user);
        navigation.navigate('App');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'App'}],
          }),
        );
        // TO DO burada App e user bilgileri AsyncStorage üzerinden taşınabilir
      }
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        console.log('Axios hatası yakalandı');

        const status = error.response?.status;
        let message = error.response?.data?.message || error.message;

        console.log('Status:', status);
        console.log('Message:', message);

        if (status === 403) message = 'Kullanıcı adı veya şifre hatalı';
        ToastAndroid.show(message || 'Bir hata oluştu', ToastAndroid.SHORT);
      } else if (error instanceof Error) {
        console.log('Genel hata yakalandı:', error.message);

        ToastAndroid.show(error.message, ToastAndroid.SHORT);
      } else {
        console.log('Bilinmeyen hata:', error);

        ToastAndroid.show('Beklenmeyen bir hata oluştu', ToastAndroid.SHORT);
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
        ToastAndroid.show('Lütfen tüm alanları doldurunuz', ToastAndroid.SHORT);
        return;
      }

      // if (!usernameRegex.test(username)) {
      //   ToastAndroid.show(
      //     'Lütfen kullanıcı adını uygun formatta giriniz',
      //     ToastAndroid.SHORT,
      //   );
      //   return;
      // }

      console.log(username);

      if (fullName.split(' ').length < 2) {
        ToastAndroid.show(
          'Lütfen ad ve soyadınızı, arada boşluk olacak şekilde yazınız',
          ToastAndroid.LONG,
        );
        return;
      }

      if (username.length < 4) {
        ToastAndroid.show(
          'Kullanıcı adı en az 4 karakter olmalı',
          ToastAndroid.SHORT,
        );
        return;
      }

      if (username.length > 25) {
        ToastAndroid.show(
          'Kullanıcı adı en fazla 25 karakter olabilir',
          ToastAndroid.SHORT,
        );
        return;
      }

      if (password.length < 8) {
        ToastAndroid.show(
          'Lütfen en az 8 karakter içeren bir şifre giriniz',
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
        // if (!kvkkApproved || !healthDataApproved) {
        ToastAndroid.show(
          'Hesap oluşturabilmek için gerekli onayları vermeniz gerekmektedir.',
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
      };
      const registerResponse = await register(registerPayload);

      // TO DO burada hata kodlarına göre hata mesajları eklenbilir

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
          locale: 'tr-TR',
          source: 'MOBILE',
        };
        const kvkkResponse = await giveConsent(kvkkConsent);

        const healthDataConsent: UpsertConsentDTO = {
          purpose: ConsentPurpose['HEALTH_DATA_PROCESSING_ACK'],
          status: healthDataApproved
            ? ConsentStatus['ACCEPTED']
            : ConsentStatus['REJECTED'],
          policyId: healthPolicy?.id!,
          locale: 'tr-TR',
          source: 'MOBILE',
        };
        const healthDataResponse = await giveConsent(healthDataConsent);

        const exerciseDataConsent: UpsertConsentDTO = {
          purpose: ConsentPurpose['EXERCISE_DATA_PROCESSING_ACK'],
          status: exerciseDataApproved
            ? ConsentStatus['ACCEPTED']
            : ConsentStatus['REJECTED'],
          policyId: exercisePolicy?.id!,
          locale: 'tr-TR',
          source: 'MOBILE',
        };
        const exerciseDataResponse = await giveConsent(exerciseDataConsent);

        const studyConsent: UpsertConsentDTO = {
          purpose: ConsentPurpose['STUDY_CONSENT_ACK'],
          status: studyApproved
            ? ConsentStatus['ACCEPTED']
            : ConsentStatus['REJECTED'],
          policyId: studyPolicy?.id!,
          locale: 'tr-TR',
          source: 'MOBILE',
        };
        const studyResponse = await giveConsent(studyConsent);

        setUser(user);

        // if (
        //   kvkkResponse &&
        //   kvkkResponse.status === 200 &&
        //   kvkkResponse.data &&
        //   healthDataResponse &&
        //   healthDataResponse.status === 200 &&
        //   healthDataResponse.data
        // ) {}

        setLoading(false);
        navigation.navigate('App');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'App'}],
          }),
        );
        // TO DO burada App e user bilgileri AsyncStorage üzerinden taşınabilir
      }
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        console.log('Axios hatası yakalandı');

        const status = error.response?.status;
        let message = error.response?.data?.message || error.message;

        console.log('Status:', status);
        console.log('Message:', message);

        if (status === 500) message = 'Bu kullanıcı adı zaten alınmış';
        ToastAndroid.show(message || 'Bir hata oluştu', ToastAndroid.SHORT);
      } else if (error instanceof Error) {
        console.log('Genel hata yakalandı:', error.message);

        ToastAndroid.show(error.message, ToastAndroid.SHORT);
      } else {
        console.log('Bilinmeyen hata:', error);

        ToastAndroid.show('Beklenmeyen bir hata oluştu', ToastAndroid.SHORT);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchConsentPolicies = async () => {
    const kvkk = await getLatestPolicy(ConsentPolicyPurpose['KVKK_NOTICE']);
    setKvkkPolicy(kvkk);
    const health = await getLatestPolicy(
      ConsentPolicyPurpose['HEALTH_DATA_PROCESSING'],
    );
    setHealthPolicy(health);
    const exercise = await getLatestPolicy(
      ConsentPolicyPurpose['EXERCISE_DATA_PROCESSING'],
    );
    setExercisePolicy(exercise);
    const study = await getLatestPolicy(ConsentPolicyPurpose['STUDY_CONSENT']);
    setStudyPolicy(study);
  };

  useEffect(() => {
    console.log('eeee');
    fetchConsentPolicies();
  }, []);

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
          {/* <Text
            className="text-3xl text-center uppercase font-rubik-bold mt-8 mb-4"
            style={{color: '#0091ff'}}>
            EGZERSİZ TAKİP{'\n'}VE{'\n'}SAĞLIK{'\n'}
            <Text className="text-center" style={{color: colors.text.primary}}>
              Uygulaması
            </Text>
          </Text> */}
          <Text
            className="text-center font-rubik-bold mt-8 mb-8"
            style={{color: '#404040', fontSize: 40}}>
            HopeMove
          </Text>
          <Text
            className="text-3xl font-rubik-semibold text-center mt-6 mb-4"
            style={{color: '#404040'}}>
            Kullanıcı Girişi
          </Text>
          {/* <Text
            className={`text-3xl font-rubik-medium text-center mb-2 mt-8`}
            style={{color: colors.text.primary}}>
            {loginMethod === LoginMethod.default && 'Giriş'}
            {loginMethod === LoginMethod.registration && 'Hesap Oluştur'}
          </Text> */}
          {loginMethod === LoginMethod.registration && (
            <View
              className="flex flex-row items-center justify-start z-50 rounded-full mt-2 py-1"
              style={{
                backgroundColor:
                  theme.name === 'Light'
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
                placeholder="Ad Soyad"
                className="text-lg font-rubik ml-5 flex-1"
                style={{color: colors.text.primary}}
              />
            </View>
          )}
          <View
            className="flex flex-row items-center justify-start z-50 rounded-full mt-2 py-1"
            style={{
              backgroundColor:
                theme.name === 'Light' ? colors.background.primary : '#333333',
            }}>
            <TextInput
              placeholderTextColor={'gray'}
              selectionColor={'#7AADFF'}
              autoCapitalize="none"
              value={username}
              onChangeText={(value: string) => {
                setUsername(value);
              }}
              placeholder="Kullanıcı adı"
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
                  backgroundColor:
                    theme.name === 'Light'
                      ? colors.background.primary
                      : '#333333',
                }}>
                <Text
                  className="text-lg font-rubik ml-6 py-3 flex-1"
                  style={{color: birthDate ? colors.text.primary : 'gray'}}>
                  {birthDate
                    ? new Date(birthDate).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Doğum Tarihi'}
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
                  locale="tr"
                  mode="date"
                  title="Tarih Seçin"
                  confirmText="Tamam"
                  cancelText="İptal"
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
                  backgroundColor:
                    theme.name === 'Light'
                      ? colors.background.primary
                      : '#333333',
                  borderRadius: 25,
                  paddingHorizontal: 22,
                  zIndex: 3000,
                }}>
                <Dropdown
                  data={[
                    {label: 'Kadın', value: 'female'},
                    {label: 'Erkek', value: 'male'},
                  ]}
                  labelField="label"
                  valueField="value"
                  placeholder="Cinsiyet"
                  value={gender}
                  onChange={item => setGender(item.value)}
                  style={{
                    backgroundColor: 'transparent', // dış View zaten arka planı taşıyor
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
                    backgroundColor:
                      theme.name === 'Light'
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
              backgroundColor:
                theme.name === 'Light' ? colors.background.primary : '#333333',
            }}>
            <TextInput
              placeholderTextColor={'gray'}
              selectionColor={'#7AADFF'}
              value={password}
              onChangeText={(value: string) => {
                setPassword(value);
              }}
              placeholder="Şifre"
              className="text-lg font-rubik ml-6 flex-1"
              style={{color: colors.text.primary}}
              secureTextEntry={!showPassword}
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-5">
              {/* TO DO icon can be changed */}
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
                  KVKK Metni ve Açık Rıza Beyanı
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
                  Aydınlatılmış Onam Formu
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
                    backgroundColor:
                      theme.name === 'Light'
                        ? colors.background.primary
                        : '#333333',
                  }}>
                  <Text
                    className="text-xl font-rubik text-center py-1"
                    style={{color: colors.text.primary}}>
                    Giriş Yap
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
                    backgroundColor:
                      theme.name === 'Light'
                        ? colors.background.primary
                        : '#333333',
                  }}>
                  <Text
                    className="text-xl font-rubik text-center py-1"
                    style={{color: colors.text.primary}}>
                    Hesap Oluştur
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
              eğer hesabın varsa {'\n'}
              <TouchableOpacity
                onPress={() => {
                  clearInputs();
                  setLoginMethod(LoginMethod.default);
                }}>
                <Text
                  className="text-xl font-rubik text-center"
                  style={{color: '#0091ff', textDecorationLine: 'underline'}}>
                  Giriş Yap
                </Text>
              </TouchableOpacity>
            </Text>
          )}
          {loginMethod !== LoginMethod.registration && (
            <Text
              className="text-lg font-rubik text-center mt-4"
              style={{color: colors.text.third}}>
              eğer hesabın yoksa{'\n'}
              <TouchableOpacity
                onPress={() => {
                  clearInputs();
                  setLoginMethod(LoginMethod.registration);
                }}>
                <Text
                  className="text-xl font-rubik text-center"
                  style={{color: '#0091ff', textDecorationLine: 'underline'}}>
                  Hesap Oluştur
                </Text>
              </TouchableOpacity>
            </Text>
          )}
          {/* <View className="flex flex-row justify-center">
            <TouchableOpacity
              onPress={handleGoogleLogin}
              className="shadow-md shadow-zinc-350 rounded-full w-5/6 py-4 mt-2"
              style={{backgroundColor: theme.name === "Light" ? colors.background.primary:"#333333"}}>
              <View className="flex flex-row items-center justify-center">
                <Image
                  source={icons.google}
                  className="w-5 h-5"
                  resizeMode="contain"
                />
                <Text
                  className="text-lg font-rubik-medium ml-3"
                  style={{color: colors.text.primary}}>
                  Google ile devam et
                </Text>
              </View>
            </TouchableOpacity>
          </View> */}
        </View>
      </ScrollView>

      <CustomModal
        visible={consentModalVisible}
        onApprove={() => {
          setKvkkAcknowledged(true);
          setHealthDataApproved(true);
          setExerciseDataApproved(true);
          setConsentModalVisible(false);
        }}
        onReject={() => {
          setKvkkAcknowledged(false);
          setHealthDataApproved(false);
          setExerciseDataApproved(false);
          setConsentModalVisible(false);
        }}
        onApproveText={`Onaylıyorum`}
        onRejectText="Onaylamıyorum"
        body={
          <>
            <Text
              className="font-rubik text-md"
              style={{color: colors.text.primary}}>
              {stripFooter(kvkkPolicy?.content)}
              {'\n'}
              {'\n'}
              {stripFooter(healthPolicy?.content)}
              {'\n'}
              {'\n'}
              {stripFooter(exercisePolicy?.content)}
              {'\n'}
              {'\n'}
              {'\n'}
              {FOOTER}
            </Text>
          </>
        }
      />
      <CustomModal
        visible={studyModalVisible}
        onApprove={() => {
          setStudyApproved(true);
          setStudyModalVisible(false);
        }}
        onReject={() => {
          setStudyApproved(false);
          setStudyModalVisible(false);
        }}
        onApproveText="Onaylıyorum"
        onRejectText="Onaylamıyorum"
        body={
          <>
            <Text
              className="font-rubik text-md"
              style={{color: colors.text.primary}}>
              {studyPolicy?.content}
            </Text>
          </>
        }
      />
    </SafeAreaView>
  );
}
export default UserLogin;

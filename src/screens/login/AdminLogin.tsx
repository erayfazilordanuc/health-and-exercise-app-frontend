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
import icons from '../../constants/icons';
import {SafeAreaView} from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNetInfo} from '@react-native-community/netinfo';
import {useTheme} from '../../themes/ThemeProvider';
import {
  login,
  loginAdmin,
  register,
  registerAdmin,
} from '../../api/auth/authService';
import {useUser} from '../../contexts/UserContext';
import DatePicker from 'react-native-date-picker';
import {Dropdown} from 'react-native-element-dropdown';
import {BlurView} from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import {LoginMethod} from '../../types/enums';

function AdminLogin() {
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
        ToastAndroid.show('Lütfen tüm alanları doldurunuz', ToastAndroid.SHORT);
        return;
      }

      if (isCodeStep && !code) {
        ToastAndroid.show(
          'Lütfen doğrulama kodunu giriniz',
          ToastAndroid.SHORT,
        );
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
      // TO DO burada hata kodlarına göre hata mesajları eklenbilir
      setLoading(false);

      if (loginResponse && loginResponse.status === 200) {
        if (!loginResponse.data) {
          setIsCodeStep(true);
          ToastAndroid.show(
            'E-postanıza doğrulama kodu gönderildi',
            ToastAndroid.SHORT,
          );
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
        console.log('Axios hatası yakalandı');

        const status = error.response?.status;
        let message = error.response?.data?.message || error.message;

        console.log('Status:', status);
        console.log('Message:', message);

        if (status === 403 || status === 500)
          message = 'Kullanıcı adı veya şifre hatalı';
        if (status === 502) message = 'Bir hata oluştu';
        ToastAndroid.show(message || 'Bir hata oluştu', ToastAndroid.SHORT);
      } else if (error instanceof Error) {
        console.log('Genel hata yakalandı:', error.message);

        const maybeStatus = (error as any).status;
        if (maybeStatus === 403 || maybeStatus === 500) {
          ToastAndroid.show(
            'Kullanıcı adı veya şifre hatalı',
            ToastAndroid.SHORT,
          );
          return;
        }
        ToastAndroid.show(
          'Bir hata oluştu, kullanıcı adı ve şifrenizi kontrol ediniz',
          ToastAndroid.LONG,
        );
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

      if (!(username && email && fullName && password)) {
        ToastAndroid.show('Lütfen tüm alanları doldurunuz', ToastAndroid.SHORT);
        return;
      }

      // if (!usernameRegex.test(username.trim())) {
      //   ToastAndroid.show(
      //     'Lütfen kullanıcı adını uygun formatta giriniz',
      //     ToastAndroid.SHORT,
      //   );
      //   return;
      // }

      if (!emailRegex.test(email.trim())) {
        ToastAndroid.show(
          'Lütfen e-postanızı uygun formatta giriniz',
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

      if (isCodeStep && !code) {
        ToastAndroid.show(
          'Lütfen doğrulama kodunu giriniz',
          ToastAndroid.SHORT,
        );
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
      // TO DO burada hata kodlarına göre hata mesajları eklenbilir
      setLoading(false);

      if (registerResponse && registerResponse.status === 200) {
        if (!registerResponse.data) {
          setIsCodeStep(true);
          ToastAndroid.show(
            'E-postanıza doğrulama kodu gönderildi',
            ToastAndroid.SHORT,
          );
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
        console.log('Axios hatası yakalandı');

        const status = error.response?.status;
        let message = error.response?.data?.message || error.message;

        console.log('Status:', status);
        console.log('Message:', message);

        if (status === 500) message = 'Bu kullanıcı adı zaten alınmış';
        if (status === 502) message = 'Bir hata oluştu';
        if (status?.toString().startsWith('4'))
          message = 'Girilen bilgilere ait bir hemşire yetkinliği bulunamadı';
        ToastAndroid.show(message || 'Bir hata oluştu', ToastAndroid.SHORT);
      } else if (error instanceof Error) {
        console.log('Genel hata yakalandı:', error.message);
        ToastAndroid.show('Beklenmeyen bir hata oluştu', ToastAndroid.SHORT);
        // ToastAndroid.show(error.message, ToastAndroid.SHORT);
      } else {
        console.log('Bilinmeyen hata:', error);

        ToastAndroid.show('Beklenmeyen bir hata oluştu', ToastAndroid.SHORT);
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
        {/* <Text
          className="text-3xl text-center uppercase font-rubik-bold mt-6 mb-4"
          style={{color: '#0091ff'}}>
          EGZERSİZ TAKİP{'\n'}VE{'\n'}SAĞLIK{'\n'}
          <Text className="text-center" style={{color: colors.text.primary}}>
            Uygulaması
          </Text>
        </Text> */}
        <Text
          className="text-center font-rubik-bold mt-8 mb-8"
          style={{
            color: '#404040' /*color: '#0091ff',*/,
            fontSize: 40,
          }}>
          HopeMove
        </Text>
        <Text
          className="text-3xl font-rubik-semibold text-center mt-6 mb-4"
          style={{color: '#404040'}}>
          Hemşire Girişi
        </Text>
        {/* <Text
            className={`text-3xl font-rubik-medium text-center mb-2 mt-4`}
            style={{color: colors.text.primary}}>
            {loginMethod === LoginMethod.default && 'Giriş'}
            {loginMethod === LoginMethod.registration && 'Hesap Oluştur'}
          </Text> */}

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
              placeholder="Ad Soyad"
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
                placeholder="E-posta"
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
                backgroundColor: theme.colors.isLight
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
            placeholder="Şifre"
            className="text-lg font-rubik ml-5 flex-1"
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
              placeholder="Doğrulama Kodu"
              className="text-lg font-rubik ml-5 flex-1"
              style={{color: colors.text.primary}}
            />
          </View>
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
                  backgroundColor: theme.colors.isLight
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
            eğer hesabınız varsa {'\n'}
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
            eğer hesabınız yoksa{'\n'}
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
      </ScrollView>

      <Modal
        transparent
        visible={kvkkModalVisible}
        animationType="fade"
        onRequestClose={() => setKvkkModalVisible(false)}>
        <View className="flex-1 justify-center items-center bg-black/40">
          <View
            // Kart: ekranın ~%70 yüksekliğini aşmasın
            style={{
              width: '91%',
              maxHeight: height * 0.7,
              borderRadius: 24,
              padding: 20,
              backgroundColor: colors.background.primary,
            }}>
            {/* Scroll alanı: kalan yüksekliği kullansın */}
            <ScrollView
              style={{flexGrow: 1}} // mevcut alanı doldur
              contentContainerStyle={{paddingBottom: 8}}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled // Android için iyi olur
            >
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
                uygulamalarını indirmeniz gerekiyor.{'\n'}Şimdi Play Store’a
                gitmek istiyor musunuz?ÖRNEK: 6698 sayılı Kanunun 16. maddesinde
                düzenlenen Veri Sorumluları Siciline kayıt yükümlülüğü
                kapsamında veri sorumlularının VERBİS’e bilgi girişi yapması.
                ÖRNEK: Gelir Vergisi Kanununun 70. maddesi gereği,
                gayrimenkulünü kiraya verenlerin, vermek zorunda olduğu yıllık
                beyanname kapsamında kendisine ait kişisel verilerin Maliye
                Bakanlığının ilgili birimlerince işlenmesi. C- Fiili İmkânsızlık
                Nedeniyle Rızasını Açıklayamayacak Durumda Bulunan Veya Rızasına
                Hukuki Geçerlilik Tanınmayan Kişinin Kendisinin ya da Bir
                Başkasının Hayatı Veya Beden Bütünlüğünün Korunması İçin Zorunlu
                Olması Kişisel verisi işlenecek kişinin herhangi bir fiili
                imkânsızlık nedeniyle rızasını açıklayamayacak durumda olması
                veya rızasına hukuki geçerlilik tanınmayan kişinin kendisi veya
                başkasının hayatı ve beden bütünlüğünün korunması için zorunlu
                olması halinde kişisel verilerin işlenmesi mümkündür. ÖRNEK:
                Bilinci yerinde olmayan bir kişinin beden bütünlüğünün korunması
                amacıyla tıbbi müdahale yapılması gereken durumlarda;
                yakınlarına haber vermek, yetkili sağlık kurumları tarafından
                tutulan kayıtlar üzerinden hasta geçmişini öğrenerek gerekli
                müdahaleyi yapmak gibi amaçlarla kişinin adı, soyadı, kimlik
                numarası, telefon numarası vb. kişisel verilerinin işlenmesi bu
                kapsamdadır. 16 16 | ÖRNEKLERLE KİŞİSEL VERİLERİN KORUNMASINA
                İLİŞKİN REHBER ÖRNEK: Hürriyeti kısıtlanan bir kişinin
                kurtarılması amacıyla, kendisinin ya da şüphelinin cep telefonu
                sinyali, kredi kartı kullanım ve işlem hareketleri, araç takip
                sistemi bilgileri, MOBESE kayıtları vb. kişisel verilerinin
                ilgili birimlerce işlenerek yer tespitini yapılması. ÖRNEK:
                Dağda mahsur kalan bir kişinin kurtarılması amacıyla, cep
                telefonu sinyali, GPS ve mobil trafik verisinin işlenerek
                yerinin belirlenmesi. D- Bir Sözleşmenin Kurulması Veya İfasıyla
                Doğrudan Doğruya İlgili Olması Kaydıyla, Sözleşmenin Taraflarına
                Ait Kişisel Verilerin İşlenmesinin Gerekli Olması Bu veri işleme
                şartına dayanarak kişisel veri işlenebilmesi için işlemenin
                gerçekten bu amaca hizmet ediyor olması ve bu amaçla sınırlı
                olarak gerçekleştiriliyor olması gereklidir. Ayrıca, işlenen
                kişisel verilerin sadece sözleşmenin taraflarına ait olması ve
                sözleşme çerçevesiyle sınırlı olmak kaydıyla kişisel veri
                işlenmesinin gerektiği de unutulmamalıdır. ÖRNEK: Bir
                emlakçının, kira sözleşmesi ile ilgili olarak ev sahibi ve
                kiracı arasında imzalanan sözleşme kapsamında tarafların kimlik
                numarası, banka hesap numarası, adres, imza ve telefon gibi
                kişisel verilerini işlemesi, dosyasında muhafaza etmesi. ÖRNEK:
                Bir satıcının müşterisine sattığı bir malı teslim etmek amacıyla
                müşterisinin adresini taşıma şirketine vermesi. 17 ÖRNEKLERLE
                KİŞİSEL VERİLERİN KORUNMASINA İLİŞKİN REHBER | 17 ÖRNEK: Bir
                bankanın, maaş müşterisi ile imzaladığı sözleşme kapsamında
                müşterinin kimlik numarası, elektronik posta, adres, imza, cep
                telefon numarası gibi kişisel verilerini işlemesi ve dosyasında
                muhafaza etmesi. E- Veri Sorumlusunun Hukuki Yükümlülüğünü
                Yerine Getirebilmesi İçin Zorunlu Olması Bu veri işleme şartının
                uygulanabilmesi için kişisel veri işleme, veri sorumlusunun
                hukuki yükümlülüğünü yerine getirebilmesi için gerekli ve bu
                amaçla sınırlı olarak gerçekleştiriliyor olmalıdır. ÖRNEK:
                Taşıma işiyle yükümlü bulunan bir kargo firması tarafından,
                kişiye teslimat yapılabilmesi için, alıcının adres ve iletişim
                bilgilerinin kaydedilmesi. ÖRNEK: Bir şirketin çalışanına maaş
                ödeyebilmesi için banka hesap bilgilerini işlemesi. ÖRNEK:
                Seminer organizasyonu yapılan bir
              </Text>
            </ScrollView>

            {/* Butonlar: Scroll alanının altında, sabit kalsın */}
            <View
              className="flex flex-row justify-between mt-5"
              // flexShrink ile butonların görünür kalmasını garanti altına al
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
                  Onaylamıyorum
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
                  Onaylıyorum
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View className="flex-1 ">
        <Text className="text-center absolute bottom-6 self-center text-sm text-gray-400">
          Hemşire hesabı başvurusu için iletişime geçebilirsiniz{'\n'}
        </Text>
        <Text className="text-center absolute bottom-6 self-center text-sm text-gray-400 underline">
          egzersiz.saglik.uygulaması@gmail.com
        </Text>
      </View>
    </SafeAreaView>
  );
}
export default AdminLogin;

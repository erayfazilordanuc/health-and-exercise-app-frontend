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
} from 'react-native';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {useEffect, useState} from 'react';
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

function AdminLogin() {
  const navigation = useNavigation<RootScreenNavigationProp>();
  const {theme, colors, setTheme} = useTheme();
  const netInfo = useNetInfo();
  const [loading, setLoading] = useState(false);

  enum LoginMethod {
    'default',
    'registration',
    'guest',
  }
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(
    LoginMethod.default,
  );

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  const [isCodeStep, setIsCodeStep] = useState(false);

  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const clearInputs = () => {
    setUsername('');
    setPassword('');
  };

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

      const registerPayload: RegisterRequestPayload = {
        username: username.trim(),
        email: email.trim(),
        fullName: fullName.trim(),
        password: password.trim(),
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
        if (status === 400)
          message = 'Girilen bilgilere ait bir hemşire yetkinliği bulunamadı';
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

  // className={`px-10 pt-${
  //         isCodeStep
  //           ? ''
  //           : loginMethod === LoginMethod.registration
  //           ? '16'
  //           : '24'
  //       }`}

  return (
    <SafeAreaView
      className="h-full"
      style={{backgroundColor: colors.background.secondary}}>
      <View
        className={`px-10`}
        style={{
          marginTop:
            loginMethod === LoginMethod.registration
              ? isCodeStep
                ? 40
                : 60
              : 96,
        }}>
        <Text
          className="text-3xl text-center uppercase font-rubik-bold mt-6 mb-4"
          style={{color: '#0091ff'}}>
          EGZERSİZ TAKİP{'\n'}VE{'\n'}SAĞLIK{'\n'}
          <Text className="text-center" style={{color: colors.text.primary}}>
            Uygulaması
          </Text>
        </Text>
        <Text
          className="text-3xl font-rubik-medium text-center mt-4 mb-4"
          style={{color: colors.text.primary}}>
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
              backgroundColor: colors.background.primary,
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
            backgroundColor: colors.background.primary,
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
          <View
            className="flex flex-row items-center justify-start z-50 rounded-full mt-2 py-1"
            style={{
              backgroundColor: colors.background.primary,
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
        )}
        <View
          className="flex flex-row items-center justify-start z-50 rounded-full mt-2 py-1"
          style={{
            backgroundColor: colors.background.primary,
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
              className="size-7 mr-2"
              tintColor={'gray'}
            />
          </TouchableOpacity>
        </View>
        {isCodeStep && (
          <View
            className="flex flex-row items-center justify-start z-50 rounded-full mt-2 py-1"
            style={{
              backgroundColor: colors.background.primary,
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
                className="shadow-md shadow-zinc-350 rounded-full w-1/2 py-3 mt-3"
                style={{backgroundColor: colors.background.primary}}>
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
                style={{backgroundColor: colors.background.primary}}>
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
              style={{backgroundColor: colors.background.primary}}>
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

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
} from 'react-native';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {useEffect, useState} from 'react';
import icons from '../../constants/icons';
import {SafeAreaView} from 'react-native-safe-area-context';
import {guestLogin, login, register} from '../../api/async_storage/authService';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNetInfo} from '@react-native-community/netinfo';
import {useTheme} from '../../themes/ThemeProvider';

function Login() {
  const navigation = useNavigation<RootScreenNavigationProp>();

  const {theme, colors, setTheme} = useTheme();

  const [versatileError, setVersatileError] = useState('');

  const [loading, setLoading] = useState(false);

  enum LoginMethod {
    'default',
    'registration',
    'guest',
  }

  const [loginMethod, setLoginMethod] = useState<LoginMethod>(
    LoginMethod.default,
  );

  const [multipleCredential, setMultipleCredential] = useState('');

  const [username, setUsername] = useState('');

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const netInfo = useNetInfo();

  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleGoogleLogin = async () => {};

  const handleLogin = async () => {
    try {
      setLoading(true);
      setMultipleCredential(multipleCredential.trim());

      if (!(multipleCredential && password)) {
        // Alert
        ToastAndroid.show('Lütfen tüm alanları doldurunuz', ToastAndroid.SHORT);
        return;
      }

      if (
        !usernameRegex.test(multipleCredential) &&
        !emailRegex.test(multipleCredential)
      ) {
        ToastAndroid.show(
          'Lütfen kullanıcı adı ya da e-postanızı uygun formatta giriniz',
          ToastAndroid.SHORT,
        );
        return;
      }

      const isEmailLogin = emailRegex.test(multipleCredential);

      const loginPayload: LoginRequestPayload = {
        username: isEmailLogin ? undefined : multipleCredential,
        email: isEmailLogin ? multipleCredential : undefined,
        password,
      };

      const loginResponse = await login(loginPayload);
      // TO DO burada hata kodlarına göre hata mesajları eklenbilir

      if (loginResponse && loginResponse.status === 200 && loginResponse.data) {
        // Şimdilik
        navigation.navigate('App');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Home'}],
          }),
        );
        // TO DO burada App e user bilgileri AsyncStorage üzerinden taşınabilir
      }
    } catch (error) {
      console.error('Error occured while login: ', error);
      ToastAndroid.show(
        error instanceof Error ? error.message : 'Bir hata oluştu',
        ToastAndroid.SHORT,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      setLoading(true);
      setEmail(email.trim());
      setUsername(username.trim());

      if (!(username && email && password)) {
        ToastAndroid.show('Lütfen tüm alanları doldurunuz', ToastAndroid.SHORT);
        return;
      }

      if (!usernameRegex.test(username)) {
        ToastAndroid.show(
          'Lütfen kullanıcı adını uygun formatta giriniz',
          ToastAndroid.SHORT,
        );
        return;
      }

      if (!emailRegex.test(email)) {
        ToastAndroid.show(
          'Lütfen e-postanızı adını uygun formatta giriniz',
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
        username: username,
        email: email,
        password: password,
      };

      const registerResponse = await register(registerPayload);
      // TO DO burada hata kodlarına göre hata mesajları eklenbilir

      if (
        registerResponse &&
        registerResponse.status === 200 &&
        registerResponse.data
      ) {
        // Şimdilik
        navigation.navigate('App');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Home'}],
          }),
        );
        // TO DO burada App e user bilgileri AsyncStorage üzerinden taşınabilir
      }
    } catch (error) {
      console.error('Error occured while login: ', error);

      ToastAndroid.show(
        error instanceof Error ? error.message : 'Bir hata oluştu',
        ToastAndroid.SHORT,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      // TO DO guest login için local username password ikilisi alınsın
      if (username && password) {
        await guestLogin(username, password);
        // TO DO MİSAFİR OLARAK DEVAM ET DENDİĞİNDE İSİM GİRME KISMI OLSUN
        navigation.navigate('App');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Home'}], // It is not working
          }),
        );
      } else {
        ToastAndroid.show(
          'Lütfen tüm alanları doldurunuz ',
          ToastAndroid.SHORT,
        );
      }
    } catch (error) {
      console.error('Error occured while login: ', error);
      ToastAndroid.show(
        error instanceof Error ? error.message : 'Bir hata oluştu',
        ToastAndroid.SHORT,
      );
    }
  };

  const clearInputs = () => {
    setMultipleCredential('');
    setUsername('');
    setEmail('');
    setPassword('');
  };

  return (
    <SafeAreaView
      className="h-full"
      style={{backgroundColor: colors.background.secondary}}>
      <ScrollView contentContainerClassName="pb-12 pt-16">
        <View
          className={`px-10 mt-${
            loginMethod === LoginMethod.registration ? '' : '16'
          }`}>
          <Text
            className="text-3xl text-center uppercase font-rubik-bold mt-12 mb-4"
            style={{color: '#0091ff'}}>
            {'{Uygulama ismi}'}
            <Text className="text-center" style={{color: colors.text.primary}}>
              Hoş Geldiniz
            </Text>
          </Text>
          <Text
            className={`text-3xl font-rubik-medium text-center ${
              loginMethod === LoginMethod.default ? 'mb-4 mt-6' : 'mb-2 mt-8'
            }`}
            style={{color: colors.text.primary}}>
            {loginMethod === LoginMethod.default && 'Giriş'}
            {loginMethod === LoginMethod.registration && 'Hesap Oluştur'}
            {loginMethod === LoginMethod.guest && 'Misafir Girişi'}
          </Text>

          {loginMethod === LoginMethod.default && (
            <View
              className="flex flex-row items-center justify-start z-50 rounded-full py-1"
              style={{
                backgroundColor: colors.background.primary,
              }}>
              {/* Email pattern check is essential */}
              <TextInput
                placeholderTextColor={'gray'}
                selectionColor={'#7AADFF'}
                value={multipleCredential}
                onChangeText={(value: string) => {
                  setMultipleCredential(value);
                }}
                placeholder="Kullanıcı adı veya e-posta"
                className="text-lg font-rubik ml-5 flex-1"
                style={{color: colors.text.primary}}
              />
            </View>
          )}
          {(loginMethod === LoginMethod.registration ||
            loginMethod === LoginMethod.guest) && (
            <View
              className="flex flex-row items-center justify-start z-50 rounded-full mt-2 py-1"
              style={{
                backgroundColor: colors.background.primary,
              }}>
              <TextInput
                placeholderTextColor={'gray'}
                selectionColor={'#7AADFF'}
                value={username}
                onChangeText={(value: string) => {
                  setUsername(value);
                }}
                placeholder="Kullanıcı adı"
                className="text-lg font-rubik ml-5 flex-1"
                style={{color: colors.text.primary}}
              />
            </View>
          )}
          {loginMethod === LoginMethod.registration && (
            <View>
              <View
                className="flex flex-row items-center justify-start z-50 rounded-full py-1 mt-2"
                style={{
                  backgroundColor: colors.background.primary,
                }}>
                {/* Email pattern check is essential */}
                <TextInput
                  placeholderTextColor={'gray'}
                  selectionColor={'#7AADFF'}
                  value={email}
                  onChangeText={(value: string) => {
                    setEmail(value);
                  }}
                  placeholder="E-posta"
                  className="text-lg font-rubik ml-5 flex-1"
                  style={{color: colors.text.primary}}
                />
              </View>
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

          <View className="flex flex-row justify-center">
            {loginMethod === LoginMethod.default && (
              <TouchableOpacity
                onPress={handleLogin}
                className="shadow-md shadow-zinc-350 rounded-full w-1/2 py-3 mt-3"
                style={{backgroundColor: colors.background.primary}}>
                <Text
                  className="text-xl font-rubik text-center mt-1"
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
                  className="text-xl font-rubik text-center mt-1"
                  style={{color: colors.text.primary}}>
                  Hesap Oluştur
                </Text>
              </TouchableOpacity>
            )}
            {loginMethod === LoginMethod.guest && (
              <TouchableOpacity
                onPress={() => {
                  handleGuestLogin();
                }}
                className="shadow-md shadow-zinc-350 rounded-full w-1/2 py-3 mt-3"
                style={{backgroundColor: colors.background.primary}}>
                <Text
                  className="text-xl font-rubik text-center mt-1"
                  style={{color: colors.text.primary}}>
                  Giriş Yap
                </Text>
              </TouchableOpacity>
            )}
          </View>

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
          <Text
            className="text-lg font-rubik text-center mt-1"
            style={{color: colors.text.third}}>
            ya da
          </Text>
          <View className="flex flex-row justify-center">
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
          </View>
          {loginMethod !== LoginMethod.guest && (
            <View>
              <Text className="text-lg font-rubik text-black-200 text-center mt-2">
                ayrıca
              </Text>
              <TouchableOpacity
                onPress={() => {
                  clearInputs();
                  setLoginMethod(LoginMethod.guest);
                }}>
                <Text
                  className="text-xl font-rubik text-center"
                  style={{
                    color: colors.text.primary,
                    textDecorationLine: 'underline',
                  }}>
                  Misafir olarak devam et
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <Text
            className="text-lg font-rubik text-center mt-2"
            style={{color: colors.text.third}}>
            seçeneklerini{'\n'}tercih edebilirsiniz
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
export default Login;

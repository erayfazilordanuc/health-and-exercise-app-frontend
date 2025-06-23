import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import icons from '../../../constants/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, {getApiBaseUrl, getIPv4} from '../../../api/axios/axios';
import {useTheme} from '../../../themes/ThemeProvider';
import {
  getTokenExpirationTime,
  getTokenTimeLeft,
  login,
} from '../../../api/auth/authService';
import {getUser} from '../../../api/user/userService';
import {AxiosError} from 'axios';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

const Security = () => {
  const insets = useSafeAreaInsets();
  const {theme, colors, setTheme} = useTheme();

  const [user, setUser] = useState<User | null>(null);

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [accessTokenTimeLeft, setAccessTokenTimeLeft] = useState<number | null>(
    null,
  );
  const [refreshTokenTimeLeft, setRefreshTokenTimeLeft] = useState<
    number | null
  >(null);

  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showRefreshToken, setShowRefreshToken] = useState(false);

  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [IPv4, setIPv4] = useState('');

  const [log, setLog] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const user: User = await getUser();
      setUser(user);
    };

    const fetchTokens = async () => {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (accessToken && refreshToken) {
        const accessTokenTimeLeft = getTokenTimeLeft(accessToken);
        const refreshTokenTimeLeft = getTokenTimeLeft(refreshToken);
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
        setAccessTokenTimeLeft(accessTokenTimeLeft);
        setRefreshTokenTimeLeft(refreshTokenTimeLeft);
      }
    };

    fetchUser();
    fetchTokens();
  }, []);

  useEffect(() => {
    const fetchApiBaseUrl = async () => {
      const apiBaseUrl = await getApiBaseUrl();
      const IPv4 = await getIPv4();

      setApiBaseUrl(apiBaseUrl);
      setIPv4(IPv4);
    };

    fetchApiBaseUrl();
  }, []);

  const checkTokenValidity = async () => {
    try {
      const tokenResponse = await apiClient.post(
        `/auth/refresh-token?refreshToken=${encodeURIComponent(refreshToken!)}`,
      );
      const userResponse = await apiClient.get('/user');

      const tokenData = JSON.stringify(tokenResponse.data, null, 2);
      const userData = JSON.stringify(userResponse.data, null, 2);
      console.log('tokenData', tokenData);
      console.log('userData', userData);
      setLog(`Token Response:\n${tokenData}\n\nUser Response:\n${userData}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response);
        setLog(
          `Axios Error: ${JSON.stringify(
            error.response?.data || error.message,
          )}`,
        );
      } else if (error instanceof Error) {
        setLog(`Generic Error: ${error.message}`);
      } else {
        setLog('Unknown error occurred.');
      }
    }
  };

  return (
    <View
      className={`flex-1 pb-16 px-3 pt-3`}
      style={{backgroundColor: colors.background.secondary}}>
      <ScrollView>
        <View
          className="flex flex-row justify-start items-center mb-2 p-4 rounded-2xl"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="text-lg font-rubik-medium"
            style={{color: colors.text.primary}}>
            Id:{'  '}
          </Text>
          <Text
            selectable
            className="text-lg font-rubik"
            style={{color: colors.text.primary}}>
            {user?.id || 'N/A'}
          </Text>
        </View>

        <View
          className="flex flex-row justify-start items-center pb-3 mb-2 p-4 rounded-2xl"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="text-lg font-rubik-medium"
            style={{color: colors.text.primary}}>
            Username:{'  '}
          </Text>
          <Text
            selectable
            className="text-lg font-rubik"
            style={{color: colors.text.primary}}>
            {user?.username || 'N/A'}
          </Text>
        </View>

        <View
          className="flex flex-row justify-start items-center pb-3 mb-2 p-4 rounded-2xl"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="text-lg font-rubik-medium"
            style={{color: colors.text.primary}}>
            Email:{'  '}
          </Text>
          <Text
            selectable
            className="text-lg font-rubik"
            style={{color: colors.text.primary}}>
            {user?.email || 'N/A'}
          </Text>
        </View>

        <View
          className="pb-3 mb-2 p-4 rounded-2xl"
          style={{backgroundColor: colors.background.primary}}>
          <View className="flex flex-row justify-between">
            <Text
              className="text-lg font-rubik-medium"
              style={{color: colors.text.primary}}>
              Access Token:{' '}
            </Text>
            <TouchableOpacity
              onPress={() => setShowAccessToken(!showAccessToken)}
              className="mr-2">
              <Image
                source={showAccessToken ? icons.arrowDown : icons.arrow}
                className="ml-12 mr-2 size-5"
                tintColor={colors.text.primary}
              />
            </TouchableOpacity>
          </View>
          <Text
            selectable
            className="text-md mt-1"
            selectionColor={colors.primary[150]}
            style={{color: colors.text.primary}}>
            {accessToken
              ? showAccessToken
                ? accessToken
                : `${accessToken.substring(0, 75)}...`
              : 'N/A'}
          </Text>
          <Text
            className="text-md font-rubik-medium mt-1"
            style={{color: colors.text.primary}}>
            Time to expiration: {Math.floor(accessTokenTimeLeft! / 60)} dakika
          </Text>
        </View>

        <View
          className="pb-3 mb-2 p-4 rounded-2xl"
          style={{backgroundColor: colors.background.primary}}>
          <View className="flex flex-row justify-between">
            <Text
              className="text-lg font-rubik-medium"
              style={{color: colors.text.primary}}>
              Refresh Token:{' '}
            </Text>
            <TouchableOpacity
              onPress={() => setShowRefreshToken(!showRefreshToken)}
              className="mr-2">
              <Image
                source={showRefreshToken ? icons.arrowDown : icons.arrow}
                className="ml-12 mr-2 size-5"
                tintColor={colors.text.primary}
              />
            </TouchableOpacity>
          </View>
          <Text
            selectable
            className="text-md mt-1"
            selectionColor={colors.primary[150]}
            style={{color: colors.text.primary}}>
            {refreshToken
              ? showRefreshToken
                ? refreshToken
                : `${refreshToken.substring(0, 75)}...`
              : 'N/A'}
          </Text>
          <Text
            className="text-md font-rubik-medium mt-1"
            style={{color: colors.text.primary}}>
            Time to expiration:{' '}
            {refreshTokenTimeLeft! > 60 * 60 * 24
              ? `${Math.floor(refreshTokenTimeLeft! / (60 * 60 * 24))} gün`
              : refreshTokenTimeLeft! > 0 * 60
              ? `${Math.floor(refreshTokenTimeLeft! / (60 * 60))} saat`
              : `${Math.floor(refreshTokenTimeLeft! / 60)} dakika`}
          </Text>
        </View>

        <View
          className="pb-4 mb-2 p-4 rounded-2xl"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="text-lg font-rubik-medium"
            style={{color: colors.text.primary}}>
            IPv4 Address:{'  '}
            <Text
              selectable
              className="text-md font-rubik"
              style={{color: colors.text.primary}}>
              {IPv4}
            </Text>
          </Text>
        </View>

        <View
          className="pb-4 mb-2 p-4 rounded-2xl"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="text-lg font-rubik-medium"
            style={{color: colors.text.primary}}>
            Api Base Url:{'  '}
            <Text selectable className="text-md font-rubik">
              {apiBaseUrl}
            </Text>
          </Text>
        </View>

        <View
          className="mb-2 p-4 rounded-2xl"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="text-lg font-rubik-medium mb-1"
            style={{color: colors.text.primary}}>
            Full User Data:
          </Text>
          <Text
            selectable
            className="text-md"
            style={{color: colors.text.primary}}>
            {JSON.stringify(user, null, 2)}
          </Text>
        </View>

        <TouchableOpacity
          className="mb-2 p-4 rounded-2xl"
          style={{
            backgroundColor: colors.background.primary,
          }}
          onPress={checkTokenValidity}>
          <MaskedView
            maskElement={
              <Text
                className="text-lg font-rubik-medium"
                style={{
                  backgroundColor: 'transparent',
                }}>
                Fetch Test
              </Text>
            }>
            <LinearGradient
              colors={[colors.primary[300], '#40E0D0']} // mavi → turkuaz
              start={{x: 0, y: 0}}
              end={{x: 0.2, y: 0}}>
              <Text
                className="text-lg font-rubik-medium"
                style={{
                  opacity: 0, // metni sadece maskeye çevirdik
                }}>
                Fetch Test
              </Text>
            </LinearGradient>
          </MaskedView>
        </TouchableOpacity>
        <View
          className="mb-2 p-4 rounded-2xl"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            selectable
            className="text-md font-rubik-medium"
            style={{color: colors.text.primary}}>
            Log:
          </Text>
          {log !== '' && (
            <Text
              selectable
              className="text-md font-rubik mt-1"
              style={{color: colors.text.primary}}>
              {log}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default Security;

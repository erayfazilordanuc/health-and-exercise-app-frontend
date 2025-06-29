import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
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
import GradientText from '../../../components/GradientText';
import {
  adminGetSymptomsById,
  adminGetSymptomsByUserId,
  getAllSymptoms,
  getAllSymptomsByDate,
  getSymptomsById,
} from '../../../api/symptoms/symptomsService';

const Development = () => {
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

  const [input, setInput] = useState('');
  const [input2, setInput2] = useState('');

  const [loading, setLoading] = useState(false);

  const [log, setLog] = useState('');
  const [log2, setLog2] = useState('');
  const [log3, setLog3] = useState('');
  const [log4, setLog4] = useState('');
  const [log5, setLog5] = useState('');
  const [log6, setLog6] = useState('');
  const [log7, setLog7] = useState('');

  const today = new Date();

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

  useEffect(() => {
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

  const testGetUser = async () => {
    try {
      const user = await getUser();

      const userData = JSON.stringify(user, null, 2);
      console.log('userData', userData);
      setLog(`User:\n${userData}`);
      fetchTokens();
      fetchUser();
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

  const testRefreshToken = async () => {
    try {
      console.log(refreshToken);
      const tokenResponse = await apiClient.post('/auth/refresh-token', null, {
        headers: {
          Authorization: `${refreshToken}`,
        },
      });

      const tokenData = JSON.stringify(tokenResponse.data, null, 2);
      console.log('tokenData', tokenData);
      setLog2(`Token Response:\n${tokenData}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response);
        setLog2(
          `Axios Error: ${JSON.stringify(
            error.response?.data || error.message,
          )}`,
        );
      } else if (error instanceof Error) {
        setLog2(`Generic Error: ${error.message}`);
      } else {
        setLog2('Unknown error occurred.');
      }
    }
  };

  // const testGetSymptomsById = async () => {
  //   try {
  //     const symptomsResponse = await getSymptomsById(input);

  //     const symptomsData = JSON.stringify(symptomsResponse.data, null, 2);
  //     console.log('symptomsData', symptomsData);
  //     setLog3(`Symptoms Response:\n${symptomsData}`);
  //     fetchTokens();
  //     fetchUser();
  //   } catch (error) {
  //     if (error instanceof AxiosError) {
  //       console.log(error.response);
  //       setLog3(
  //         `Axios Error: ${JSON.stringify(
  //           error.response?.data || error.message,
  //         )}`,
  //       );
  //     } else if (error instanceof Error) {
  //       setLog3(`Generic Error: ${error.message}`);
  //     } else {
  //       setLog3('Unknown error occurred.');
  //     }
  //   }
  // };

  const testAdminGetSymptomsById = async () => {
    try {
      const symptomsResponse = await adminGetSymptomsById(parseInt(input));

      const symptomsData = JSON.stringify(symptomsResponse.data, null, 2);
      console.log('symptomsData', symptomsData);
      setLog3(`Symptoms Response:\n${symptomsData}`);
      fetchTokens();
      fetchUser();
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response);
        setLog3(
          `Axios Error: ${JSON.stringify(
            error.response?.data || error.message,
          )}`,
        );
      } else if (error instanceof Error) {
        setLog3(`Generic Error: ${error.message}`);
      } else {
        setLog3('Unknown error occurred.');
      }
    }
  };

  const testAdminGetSymptomsByUserId = async () => {
    try {
      const symptomsResponse = await adminGetSymptomsByUserId(parseInt(input2));

      const symptomsData = JSON.stringify(symptomsResponse.data, null, 2);
      console.log('symptomsData', symptomsData);
      setLog7(`Symptoms Response:\n${symptomsData}`);
      fetchTokens();
      fetchUser();
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response);
        setLog7(
          `Axios Error: ${JSON.stringify(
            error.response?.data || error.message,
          )}`,
        );
      } else if (error instanceof Error) {
        setLog7(`Generic Error: ${error.message}`);
      } else {
        setLog7('Unknown error occurred.');
      }
    }
  };

  const testGetAllSymptoms = async () => {
    try {
      const symptomsResponse = await getAllSymptoms();

      const symptomsData = JSON.stringify(symptomsResponse.data, null, 2);
      console.log('symptomsData', symptomsData);
      setLog4(`Symptoms Response:\n${symptomsData}`);
      fetchTokens();
      fetchUser();
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response);
        setLog4(
          `Axios Error: ${JSON.stringify(
            error.response?.data || error.message,
          )}`,
        );
      } else if (error instanceof Error) {
        setLog4(`Generic Error: ${error.message}`);
      } else {
        setLog4('Unknown error occurred.');
      }
    }
  };

  const testGetAllSymptomsByDate = async () => {
    try {
      const symptomsResponse = await getAllSymptomsByDate(today);

      const symptomsData = JSON.stringify(symptomsResponse.data, null, 2);
      console.log('symptomsData', symptomsData);
      setLog5(`Symptoms Response:\n${symptomsData}`);
      fetchTokens();
      fetchUser();
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response);
        setLog5(
          `Axios Error: ${JSON.stringify(
            error.response?.data || error.message,
          )}`,
        );
      } else if (error instanceof Error) {
        setLog5(`Generic Error: ${error.message}`);
      } else {
        setLog5('Unknown error occurred.');
      }
    }
  };

  const testGetLocalSymptoms = async () => {
    try {
      const key = 'symptoms_' + new Date().toISOString().slice(0, 10);
      const localData = await AsyncStorage.getItem(key);
      if (!localData) return;
      const localSymptoms: LocalSymptoms = JSON.parse(localData);
      const localSymptomsString = JSON.stringify(localSymptoms, null, 2);
      console.log('symptomsLocalData', localSymptomsString);
      setLog6(`Local Symptoms Response:\n${localSymptomsString}`);
      fetchTokens();
      fetchUser();
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response);
        setLog6(
          `Axios Error: ${JSON.stringify(
            error.response?.data || error.message,
          )}`,
        );
      } else if (error instanceof Error) {
        setLog6(`Generic Error: ${error.message}`);
      } else {
        setLog6('Unknown error occurred.');
      }
    }
  };

  const testActivityIndicatorLoadingState = async () => {
    setLoading(true);
    const loginDTO: LoginRequestPayload = {
      username: 'erayfazilordanuc',
      password: 'Bismillah1*',
    };
    const credentials: AdminLoginRequestPayload = {
      loginDTO: loginDTO,
      code: null,
    };
    const response = await apiClient.post('/auth/admin/login', credentials);
    console.log('test login admin', response);
    setLoading(false);
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
            Full Name:{'  '}
          </Text>
          <Text
            selectable
            className="text-lg font-rubik"
            style={{color: colors.text.primary}}>
            {user?.fullName || 'N/A'}
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

        {/* <View
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
        </View> */}

        <View
          className="p-3 mb-1 rounded-2xl"
          style={{
            backgroundColor: colors.background.primary,
          }}>
          <TouchableOpacity
            className="p-2 rounded-2xl "
            style={{
              backgroundColor: colors.background.secondary,
            }}
            onPress={testGetUser}>
            <GradientText
              className="text-lg font-rubik-medium ml-2"
              start={{x: 0, y: 0}}
              end={{x: 0.3, y: 0}}
              colors={[colors.primary[300], '#40E0D0']}>
              Get User Test
            </GradientText>
          </TouchableOpacity>
          <View className="p-4 rounded-2xl">
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
        </View>

        <View
          className="p-3 my-1 rounded-2xl"
          style={{
            backgroundColor: colors.background.primary,
          }}>
          <TouchableOpacity
            className="p-2 rounded-2xl "
            style={{
              backgroundColor: colors.background.secondary,
            }}
            onPress={testRefreshToken}>
            <GradientText
              className="text-lg font-rubik-medium ml-2"
              start={{x: 0, y: 0}}
              end={{x: 0.3, y: 0}}
              colors={[colors.primary[300], '#40E0D0']}>
              Refresh Token Test
            </GradientText>
          </TouchableOpacity>
          <View className="p-4 rounded-2xl">
            <Text
              selectable
              className="text-md font-rubik-medium"
              style={{color: colors.text.primary}}>
              Log:
            </Text>
            {log2 !== '' && (
              <Text
                selectable
                className="text-md font-rubik mt-1"
                style={{color: colors.text.primary}}>
                {log2}
              </Text>
            )}
          </View>
        </View>

        {user?.role === 'ROLE_ADMIN' && (
          <>
            <View
              className="p-3 my-1 rounded-2xl"
              style={{
                backgroundColor: colors.background.primary,
              }}>
              <TouchableOpacity
                className="p-2 rounded-2xl "
                style={{
                  backgroundColor: colors.background.secondary,
                }}
                onPress={testAdminGetSymptomsById}>
                <GradientText
                  className="text-lg font-rubik-medium ml-2"
                  start={{x: 0, y: 0}}
                  end={{x: 0.3, y: 0}}
                  colors={[colors.primary[300], '#40E0D0']}>
                  Admin Get Symptoms By Id Test
                </GradientText>
              </TouchableOpacity>
              <View
                className="rounded-2xl mt-2 w-1/4 h-12"
                style={{
                  backgroundColor: colors.background.secondary,
                }}>
                <TextInput
                  placeholderTextColor={'gray'}
                  selectionColor={'#7AADFF'}
                  autoCapitalize="none"
                  value={input}
                  onChangeText={(value: string) => {
                    setInput(value);
                  }}
                  placeholder="Id"
                  className="rounded-2xl ml-3 text-md font-rubik flex-1"
                  style={{
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                />
              </View>
              <View className="p-4 rounded-2xl">
                <Text
                  selectable
                  className="text-md font-rubik-medium"
                  style={{color: colors.text.primary}}>
                  Log:
                </Text>
                {log3 !== '' && (
                  <Text
                    selectable
                    className="text-md font-rubik mt-1"
                    style={{color: colors.text.primary}}>
                    {log3}
                  </Text>
                )}
              </View>
            </View>
            <View
              className="p-3 my-1 rounded-2xl"
              style={{
                backgroundColor: colors.background.primary,
              }}>
              <TouchableOpacity
                className="p-2 rounded-2xl "
                style={{
                  backgroundColor: colors.background.secondary,
                }}
                onPress={testAdminGetSymptomsByUserId}>
                <GradientText
                  className="text-lg font-rubik-medium ml-2"
                  start={{x: 0, y: 0}}
                  end={{x: 0.3, y: 0}}
                  colors={[colors.primary[300], '#40E0D0']}>
                  Admin Get Symptoms By User Id Test
                </GradientText>
              </TouchableOpacity>
              <View
                className="rounded-2xl mt-2 w-1/4 h-12"
                style={{
                  backgroundColor: colors.background.secondary,
                }}>
                <TextInput
                  placeholderTextColor={'gray'}
                  selectionColor={'#7AADFF'}
                  autoCapitalize="none"
                  value={input2}
                  onChangeText={(value: string) => {
                    setInput2(value);
                  }}
                  placeholder="Id"
                  className="rounded-2xl ml-3 text-md font-rubik flex-1"
                  style={{
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                />
              </View>
              <View className="p-4 rounded-2xl">
                <Text
                  selectable
                  className="text-md font-rubik-medium"
                  style={{color: colors.text.primary}}>
                  Log:
                </Text>
                {log7 !== '' && (
                  <Text
                    selectable
                    className="text-md font-rubik mt-1"
                    style={{color: colors.text.primary}}>
                    {log7}
                  </Text>
                )}
              </View>
            </View>
          </>
        )}

        <View
          className="p-3 my-1 rounded-2xl"
          style={{
            backgroundColor: colors.background.primary,
          }}>
          <TouchableOpacity
            className="p-2 rounded-2xl "
            style={{
              backgroundColor: colors.background.secondary,
            }}
            onPress={testGetAllSymptoms}>
            <GradientText
              className="text-lg font-rubik-medium ml-2"
              start={{x: 0, y: 0}}
              end={{x: 0.3, y: 0}}
              colors={[colors.primary[300], '#40E0D0']}>
              Get All Symptoms Test
            </GradientText>
          </TouchableOpacity>
          <View className="p-4 rounded-2xl">
            <Text
              selectable
              className="text-md font-rubik-medium"
              style={{color: colors.text.primary}}>
              Log:
            </Text>
            {log4 !== '' && (
              <Text
                selectable
                className="text-md font-rubik mt-1"
                style={{color: colors.text.primary}}>
                {log4}
              </Text>
            )}
          </View>
        </View>

        <View
          className="p-3 my-1 rounded-2xl"
          style={{
            backgroundColor: colors.background.primary,
          }}>
          <TouchableOpacity
            className="p-2 rounded-2xl "
            style={{
              backgroundColor: colors.background.secondary,
            }}
            onPress={testGetAllSymptomsByDate}>
            <GradientText
              className="text-lg font-rubik-medium ml-2"
              start={{x: 0, y: 0}}
              end={{x: 0.3, y: 0}}
              colors={[colors.primary[300], '#40E0D0']}>
              Get All Symptoms By Date Test
            </GradientText>
          </TouchableOpacity>
          <View className="p-4 rounded-2xl">
            <Text
              selectable
              className="text-md font-rubik-medium"
              style={{color: colors.text.primary}}>
              Log:
            </Text>
            {log5 !== '' && (
              <Text
                selectable
                className="text-md font-rubik mt-1"
                style={{color: colors.text.primary}}>
                {log5}
              </Text>
            )}
          </View>
        </View>

        <View
          className="p-3 mt-1 mb-2 rounded-2xl"
          style={{
            backgroundColor: colors.background.primary,
          }}>
          <TouchableOpacity
            className="p-2 rounded-2xl "
            style={{
              backgroundColor: colors.background.secondary,
            }}
            onPress={testGetLocalSymptoms}>
            <GradientText
              className="text-lg font-rubik-medium ml-2"
              start={{x: 0, y: 0}}
              end={{x: 0.3, y: 0}}
              colors={[colors.primary[300], '#40E0D0']}>
              Get Local Symptoms
            </GradientText>
          </TouchableOpacity>
          <View className="p-4 rounded-2xl">
            <Text
              selectable
              className="text-md font-rubik-medium"
              style={{color: colors.text.primary}}>
              Log:
            </Text>
            {log6 !== '' && (
              <Text
                selectable
                className="text-md font-rubik mt-1"
                style={{color: colors.text.primary}}>
                {log6}
              </Text>
            )}
          </View>
        </View>

        <View
          className="p-3 mt-1 mb-2 rounded-2xl"
          style={{
            backgroundColor: colors.background.primary,
          }}>
          <TouchableOpacity
            className="p-2 rounded-2xl "
            style={{
              backgroundColor: colors.background.secondary,
            }}
            onPress={testActivityIndicatorLoadingState}>
            <GradientText
              className="text-lg font-rubik-medium ml-2"
              start={{x: 0, y: 0}}
              end={{x: 0.3, y: 0}}
              colors={[colors.primary[300], '#40E0D0']}>
              Activity Indicator Loading State Test
            </GradientText>
          </TouchableOpacity>
          <View className="p-4 h-16 rounded-2xl">
            {loading && (
              <ActivityIndicator
                className="mt-2 mb-2"
                size="large"
                color={colors.primary[300] ?? colors.primary}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Development;

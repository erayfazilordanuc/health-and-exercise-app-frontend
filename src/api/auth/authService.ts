import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../axios/axios';
import {jwtDecode} from 'jwt-decode';
import {Platform} from 'react-native';
import {useUser} from '../../contexts/UserContext';
import {themes} from '../../themes/themes';
import {queryClient} from '../../lib/react-query/client';
import {useTheme} from '../../themes/ThemeProvider';
import {useQueryClient} from '@tanstack/react-query';
import {useCallback} from 'react';

const REMINDER_FLAG = 'EXERCISE_REMINDER_SCHEDULED';
const TEST_REMINDER_FLAG = 'EXERCISE_REMINDER_TEST_SET';

export const login = async (credentials: LoginRequestPayload) => {
  const response = await apiClient.post('/auth/login', credentials);
  console.log('login', response);
  const user = response.data.userDTO as User;
  const accessToken = response.data.accessToken;
  const refreshToken = response.data.refreshToken;
  await AsyncStorage.setItem('user', JSON.stringify(user));
  await AsyncStorage.setItem('accessToken', accessToken);
  await AsyncStorage.setItem('refreshToken', refreshToken);
  return response;
};

export const register = async (credentials: RegisterRequestPayload) => {
  const response = await apiClient.post('/auth/register', credentials);
  console.log('register', response);
  const user = response.data.userDTO as User;
  const accessToken = response.data.accessToken;
  const refreshToken = response.data.refreshToken;
  await AsyncStorage.setItem('user', JSON.stringify(user));
  await AsyncStorage.setItem('accessToken', accessToken);
  await AsyncStorage.setItem('refreshToken', refreshToken);
  return response;
};

export const loginAdmin = async (credentials: AdminLoginRequestPayload) => {
  const response = await apiClient.post('/auth/admin/login', credentials);
  console.log('login', response);
  if (response.data) {
    const user = response.data.userDTO as User;
    const accessToken = response.data.accessToken;
    const refreshToken = response.data.refreshToken;
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    const newUserTheme: UserTheme = {
      theme: themes.blue.light,
      isDefault: true,
    };
    await AsyncStorage.setItem(
      `${user.username}-main-theme`,
      JSON.stringify(newUserTheme),
    );
  }
  return response;
};

export const registerAdmin = async (
  credentials: AdminRegisterRequestPayload,
) => {
  const response = await apiClient.post('/auth/admin/register', credentials);
  console.log('register', response);
  if (response.data) {
    const user = response.data.userDTO as User;
    const accessToken = response.data.accessToken;
    const refreshToken = response.data.refreshToken;
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    const newUserTheme: UserTheme = {
      theme: themes.blue.light,
      isDefault: true,
    };
    await AsyncStorage.setItem(
      `${user.username}-main-theme`,
      JSON.stringify(newUserTheme),
    );
  }
  return response;
};

export const refreshAccessToken = async () => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');

  if (refreshToken) {
    const response = await apiClient.post('/auth/refresh-token', null, {
      headers: {
        Authorization: `${refreshToken}`,
      },
    });

    const newAccessToken = response.data.accessToken;
    const newRefreshToken = response.data.refreshToken;
    console.log('newAccessToken', newAccessToken);
    console.log('newRefreshToken', newRefreshToken);
    await AsyncStorage.setItem('accessToken', newAccessToken);
    await AsyncStorage.setItem('refreshToken', newRefreshToken);

    return newAccessToken;
  } else throw new Error('No refresh token found.');
};

export function useLogout() {
  const {user, setUser} = useUser();
  const queryClient = useQueryClient();

  const logout = useCallback(async () => {
    const userId = user?.id;

    setUser(null);

    if (userId) {
      try {
        await apiClient.delete('/notifications/user/fcm-token', {
          data: {userId, platform: Platform.OS},
        });
      } catch (err) {
        console.log('error deleting fcm token', err);
      }
    }

    await AsyncStorage.removeItem('user');

    await queryClient.cancelQueries();
    queryClient.removeQueries(); // v4/v5 için güvenli
    queryClient.getMutationCache()?.clear?.();

    await AsyncStorage.clear();
  }, [user?.id, setUser, queryClient]);

  return logout;
}

export const logout = async () => {
  const userData = await AsyncStorage.getItem('user');
  if (userData) {
    const user: User = JSON.parse(userData);
    const deleteFcmTokenPayload = {userId: user.id, platform: Platform.OS};
    try {
      const response = await apiClient.delete('/notifications/user/fcm-token', {
        data: deleteFcmTokenPayload,
      });
      console.log('delete fcm token by user id', response);
    } catch (error) {
      console.log('error deleting', error);
    }
  }
  await queryClient.cancelQueries();
  await queryClient.clear();
  await AsyncStorage.clear();

  // const key = 'symptoms_' + new Date().toISOString().slice(0, 10);
  // await AsyncStorage.removeItem(key);
  // await AsyncStorage.removeItem('user');
  // await AsyncStorage.removeItem('accessToken');
  // await AsyncStorage.removeItem('refreshToken');
  // await AsyncStorage.removeItem('fcmToken');
  // await AsyncStorage.removeItem('dailyStatus');
  // await AsyncStorage.removeItem(REMINDER_FLAG);
  // await AsyncStorage.removeItem(TEST_REMINDER_FLAG);
  // await AsyncStorage.multiRemove(
  //   (
  //     await AsyncStorage.getAllKeys()
  //   ).filter(
  //     key =>
  //       key.startsWith('exerciseProgress_') || key.startsWith('lastMessage_'),
  //   ),
  // );
  // await AsyncStorage.removeItem('session_state');
  // await AsyncStorage.removeItem('session_queue');
  // await AsyncStorage.removeItem('session_history');
  // await AsyncStorage.removeItem('RQ_CACHE_V1');
};

export const getTokenExpirationTime = (token: string): number | null => {
  try {
    const decoded = jwtDecode(token) as {exp?: number};
    return decoded.exp ?? null;
  } catch (error) {
    console.error('Token decode edilemedi:', error);
    return null;
  }
};

export const getTokenTimeLeft = (token: string): number | null => {
  const exp = getTokenExpirationTime(token);
  if (!exp) return null;

  const now = Math.floor(Date.now() / 1000); // şu anki zaman (saniye)
  const timeLeft = exp - now;

  return timeLeft; // saniye olarak kalan süre
};

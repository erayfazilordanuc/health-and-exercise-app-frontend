import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../axios/axios';
import {jwtDecode} from 'jwt-decode';
import {Platform} from 'react-native';
import {useUser} from '../../contexts/UserContext';
import {themes} from '../../themes/themes';

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
  const newUserTheme: UserTheme = {
    theme: themes.primary.light,
    isDefault: true,
  };
  await AsyncStorage.setItem(
    `${user.username}-main-theme`,
    JSON.stringify(newUserTheme),
  );
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
  const newUserTheme: UserTheme = {
    theme: themes.primary.light,
    isDefault: true,
  };
  await AsyncStorage.setItem(
    `${user.username}-main-theme`,
    JSON.stringify(newUserTheme),
  );
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
      theme: themes.primary.light,
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
      theme: themes.primary.light,
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

export const logout = async () => {
  const userData = await AsyncStorage.getItem('user');
  if (userData) {
    const user: User = JSON.parse(userData);
    await AsyncStorage.removeItem(`${user.username}-main-theme`);

    const deleteFcmTokenPayload = {userId: user.id, platform: Platform.OS};
    try {
      const response = await apiClient.delete('/notifications/user/fcm-token', {
        data: deleteFcmTokenPayload,
      });
    } catch (error) {
      console.log('error deleting', error);
    }
  }

  const key = 'symptoms_' + new Date().toISOString().slice(0, 10);
  await AsyncStorage.removeItem(key);
  await AsyncStorage.removeItem('user');
  await AsyncStorage.removeItem('accessToken');
  await AsyncStorage.removeItem('refreshToken');
  await AsyncStorage.removeItem('fcmToken');
  await AsyncStorage.removeItem('dailyStatus');
  await AsyncStorage.removeItem(REMINDER_FLAG);
  await AsyncStorage.removeItem(TEST_REMINDER_FLAG);
  await AsyncStorage.multiRemove(
    (
      await AsyncStorage.getAllKeys()
    ).filter(key => key.startsWith('exerciseProgress_')),
  );
  await AsyncStorage.removeItem('lastMessage');
  await AsyncStorage.removeItem('session_state');
  await AsyncStorage.removeItem('session_queue');
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

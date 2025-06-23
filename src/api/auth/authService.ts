import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../axios/axios';
import {jwtDecode} from 'jwt-decode';

export const login = async (credentials: LoginRequestPayload) => {
  const response = await apiClient.post('/auth/login', credentials);
  console.log('login', response);
  const user = response.data.user as User;
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
  const user = response.data.user as User;
  const accessToken = response.data.accessToken;
  const refreshToken = response.data.refreshToken;
  await AsyncStorage.setItem('user', JSON.stringify(user));
  await AsyncStorage.setItem('accessToken', accessToken);
  await AsyncStorage.setItem('refreshToken', refreshToken);
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
  await AsyncStorage.removeItem('user');
  await AsyncStorage.removeItem('accessToken');
  await AsyncStorage.removeItem('refreshToken');
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

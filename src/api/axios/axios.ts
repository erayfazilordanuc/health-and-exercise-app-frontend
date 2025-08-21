import axios, {AxiosError} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {logout, refreshAccessToken} from '../auth/authService';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {ToastAndroid} from 'react-native';
import { isKvkkRequiredError, KvkkRequiredError } from '../errors/errors';

const domain = 'eray.ordanuc.com';
const API_BASE_URL = 'https://eray.ordanuc.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getApiBaseUrl = async () => {
  return API_BASE_URL;
};

const getIPv4 = async () => {
  const response = await apiClient.get(
    'https://dns.google/resolve?name=' + domain + '&type=A',
  );
  const IPv4 = response.data.Answer[0].data;
  return IPv4;
};

const noAuthRequired = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh-token',
  '/auth/guest',
];

// Interceptor örneği
// apiClient.interceptors.request.use(
//   async config => {
//     // Token varsa ekle
//     const token = await getTokenFromStorage();
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   },
//   error => Promise.reject(error)
// );

apiClient.interceptors.request.use(async config => {
  if (!noAuthRequired.some(url => config.url?.includes(url))) {
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (accessToken) {
      // --- SAFE BP: Bearer prefix yoksa ekle; varsa olduğu gibi bırak ---
      config.headers.Authorization = accessToken.startsWith('Bearer ')
        ? accessToken
        : `Bearer ${accessToken}`;
    }
  }
  return config;
});

// (İstersen bunu bırakabilirsin; alttaki büyük interceptor zaten KVKK'yı erken kesiyor)
// apiClient.interceptors.response.use(
//   res => res,
//
//   // Bu küçük handler kalırsa da sorun yok; idempotent
//   err => {
//     if (isKvkkRequiredError(err)) {
//       return Promise.reject(new KvkkRequiredError());
//     }
//     return Promise.reject(err);
//   },
// );

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  response => response,

  async error => {
    console.log('❌ API ERROR:');
    console.log('Request URL:', error.config?.url);
    console.log('Status Code:', error.response?.status);
    console.log('Response Data:', error.response?.data);
    console.log('Response', error.response);
    console.log('Error', error);

    if (error.message === 'Network Error') {
      console.log('🚨 İnternet bağlantınızı kontrol edin!');
      ToastAndroid.show(
        'İnternet bağlantınızı kontrol edin',
        ToastAndroid.LONG,
      );
    }

    // --- ADD: KVKK'yi en başta yakala ve KISA DEVRE ET ---
    if (isKvkkRequiredError(error)) {
      return Promise.reject(new KvkkRequiredError());
    }
    // --- END ADD ---

    const originalRequest = error.config;

    if (
      error.response?.status === 500 && // (mevcut davranışı bozmadım)
      !originalRequest._retry &&
      !noAuthRequired.some(url => originalRequest.url?.includes(url))
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({resolve, reject});
        })
          .then(token => {
            originalRequest.headers.Authorization = (
              token as string
            )?.startsWith('Bearer ')
              ? token
              : `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = newAccessToken?.startsWith(
          'Bearer ',
        )
          ? newAccessToken
          : `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        // await logout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export function isAxiosErr(e: unknown): e is AxiosError {
  return !!(e as any)?.isAxiosError;
}

export default apiClient;
export {getApiBaseUrl, getIPv4};

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {logout, refreshAccessToken} from '../auth/authService';
import {CommonActions, useNavigation} from '@react-navigation/native';

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
      config.headers.Authorization = accessToken;
    }
  }

  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (
      (error.response?.status === 500 ||
        error.response?.status === 401 ||
        error.response?.status === 403) &&
      !originalRequest._retry &&
      !noAuthRequired.some(url => originalRequest.url?.includes(url))
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({resolve, reject});
        })
          .then(token => {
            originalRequest.headers.Authorization = token;
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = newAccessToken;
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

export default apiClient;
export {getApiBaseUrl, getIPv4};

import apiClient from '../axios/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getUser = async (): Promise<User | null> => {
  AsyncStorage.removeItem('user');

  const response = await apiClient.get('/user');

  const user = response.data;
  AsyncStorage.setItem('user', JSON.stringify(user));

  return user;
};

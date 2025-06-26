import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../axios/axios';

export const getUser = async () => {
  const userJson = await AsyncStorage.getItem('user');
  let user: User;
  if (userJson) {
    user = JSON.parse(userJson);
  } else {
    const response = await apiClient.get('/users/me');
    user = response.data;
    console.log('user', response);
    AsyncStorage.setItem('user', JSON.stringify(user));
  }
  return user;
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../axios/axios';
import NetInfo from '@react-native-community/netinfo';

export const getUser = async () => {
  const {isConnected} = await NetInfo.fetch();
  if (!isConnected) {
    const userJson = await AsyncStorage.getItem('user');
    if (userJson) {
      const user: User = JSON.parse(userJson);
      return user;
    }
  }

  const response = await apiClient.get('/users/me');
  console.log('user', response);
  const user: User = response.data;
  AsyncStorage.setItem('user', JSON.stringify(user));
  return user;
};

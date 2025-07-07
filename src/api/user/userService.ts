import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../axios/axios';
import NetInfo from '@react-native-community/netinfo';

export const getLocalUser = async () => {
  const userJson = await AsyncStorage.getItem('user');
  if (userJson) {
    const user: User = JSON.parse(userJson);
    return user;
  }
};

export const getUser = async () => {
  const {isConnected} = await NetInfo.fetch();
  if (isConnected) {
    const response = await apiClient.get('/users/me');
    if (response.status === 200) {
      console.log('user', response);
      const user: User = response.data;
      AsyncStorage.setItem('user', JSON.stringify(user));
      return user;
    }
  }
  const userJson = await AsyncStorage.getItem('user');
  const user: User = JSON.parse(userJson!);
  return user;
};

export const getUserById = async (id: number) => {
  const response = await apiClient.get(`/users/id/${id}`);
  console.log('user by id', response);
  if (response.status !== 200) return null;
  const user: User = response.data;
  return user;
};

export const getUsersByGroupId = async (groupId: number) => {
  const response = await apiClient.get(`/users/group/id/${groupId}`);
  console.log('users', response);
  return response;
};

export const getUserByUsername = async (username: string) => {
  const response = await apiClient.get(`/users/${username}`);
  console.log('user by id', response);
  if (response.status !== 200) return null;
  const user: User = response.data;
  return user;
};

export const updateUser = async (updateUserDTO: UpdateUserDTO) => {
  const response = await apiClient.put('/users/me', updateUserDTO);
  console.log('update user response', response);
  return response;
};

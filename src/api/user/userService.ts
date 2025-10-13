import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../axios/axios';
import NetInfo from '@react-native-community/netinfo';
import {AvatarKey} from '../../constants/avatars';
import {useUser} from '../../contexts/UserContext';

export const getLocalUser = async () => {
  const userJson = await AsyncStorage.getItem('user');
  if (userJson) {
    const user: User = JSON.parse(userJson);
    return user;
  }
};

export const getDbUser = async () => {
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
};

export const getUser = async () => {
  const dbUser = getDbUser();
  if (dbUser) return dbUser;

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
  AsyncStorage.setItem('user', JSON.stringify(response.data));
  return response;
};

export const updateUserTheme = async (themeKey: String) => {
  const response = await apiClient.put(`/users/theme/${themeKey}`);
  console.log('update user theme response', response);
  AsyncStorage.setItem('user', JSON.stringify(response.data));
  return response;
};

export const updateUserMeasurements = async (dto: UpdateMeasurementsDTO) => {
  const response = await apiClient.put(`/users/measurements`, dto);
  console.log('update user measurements response', response);
  AsyncStorage.setItem('user', JSON.stringify(response.data));
  return response;
};

export const updateAvatarApi = async (key: string) => {
  const response = await apiClient.put(`/users/me/avatar/${key}`);
  console.log('update user avatar response', response);
  return response;
};

export const useUpdateAvatar = () => {
  const {setUser} = useUser();

  const updateAvatar = async (key: string) => {
    await updateAvatarApi(key);
    let user = await getLocalUser();
    if (user) {
      user.avatar = key;
      AsyncStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    }
  };

  return {updateAvatar};
};

export const deleteUser = async (): Promise<boolean> => {
  try {
    const response = await apiClient.delete('/users/me');
    console.log('delete user response', response);

    if (response.status === 200 || response.status === 204) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('delete user error', error);
    return false;
  }
};

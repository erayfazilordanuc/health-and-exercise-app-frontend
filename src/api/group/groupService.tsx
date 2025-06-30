import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../axios/axios';
import {getUser} from '../user/userService';

export const getAllGroups = async () => {
  const response = await apiClient.get(`/groups`);
  console.log('All groups', response);
  return response;
};

export const getGroupById = async (id: number) => {
  const response = await apiClient.get(`/groups/id/${id}`);
  console.log('Get group by id', response);
  return response;
};

export const getGroupSize = async (id: number) => {
  const response = await apiClient.get(`/groups/id/${id}/size`);
  console.log('Get group size by id', response);
  return response;
};

export const getGroupAdmin = async (id: number) => {
  const response = await apiClient.get(`/groups/id/${id}/admin`);
  console.log('Get group admin by group id', response);
  return response;
};

export const createGroup = async (createGroupDTO: CreateGroupDTO) => {
  const response = await apiClient.post(`/groups`, createGroupDTO);
  console.log('Create group', response);
  return response;
};

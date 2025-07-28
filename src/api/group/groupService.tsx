import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../axios/axios';
import {getUser} from '../user/userService';

export const sendJoinGroupRequest = async (groupId: number) => {
  const response = await apiClient.post(`/groups/id/${groupId}/join-request`);
  console.log('Send group request', response);
  return response;
};

export const deleteJoinGroupRequest = async (groupRequestId: number) => {
  const response = await apiClient.delete(
    `/groups/join-request/id/${groupRequestId}`,
  );
  console.log('Delete group request', response);
  return response;
};

export const getGroupRequestsByGroupId = async (groupId: number) => {
  const response = await apiClient.get(`/groups/id/${groupId}/join-request`);
  console.log('Get group request by group id', response);
  return response;
};

export const getGroupRequestsByUserId = async (userId: number) => {
  const response = await apiClient.get(
    `/groups/join-request/user/id/${userId}`,
  );
  console.log('Get group request by user id', response);
  return response;
};

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
  if (response.status >= 200 && response.status < 300) return response.data;
  else return null;
};

export const getUsersByGroupId = async (groupId: number) => {
  const response = await apiClient.get(`/groups/id/${groupId}/users`);
  console.log('Group users', response);
  return response;
};

export const createGroup = async (createGroupDTO: CreateGroupDTO) => {
  const response = await apiClient.post(`/groups`, createGroupDTO);
  console.log('Create group', response);
  return response;
};

import apiClient from '../axios/axios';

export const saveMessage = async (message: Message) => {
  const response = await apiClient.put(`/messages`, message);
  console.log('Save message', response);
  return response;
};

export const getMessageById = async (id: number) => {
  const response = await apiClient.get(`/messages/id/${id}`);
  console.log('Get message by id', response);
  return response;
};

export const isRoomExist = async (id: number) => {
  const response = await apiClient.get(`/messages/exists/room/id/${id}`);
  console.log('Is room exist', response);
  return response;
};

export const isRoomExistBySenderAndReceiver = async (
  sender: string,
  receiver: string,
) => {
  const response = await apiClient.get(
    `/messages/room/sender/${sender}/receiver/${receiver}`,
  );
  console.log('Is room exist by sender and receiver', response);
  return response;
};

export const getNextRoomId = async () => {
  const response = await apiClient.get(`/messages/room/next-id`);
  console.log('Get next room id', response);
  return response;
};

export const getMessagesByRoomId = async (roomId: number) => {
  const response = await apiClient.get(`/messages/room/id/${roomId}`);
  console.log('Get messages by room id', response);
  return response;
};

export const getMessagesBySender = async (sender: string) => {
  const response = await apiClient.get(`/messages/sender/${sender}`);
  console.log('Get messages by sender', response);
  return response;
};

export const getMessagesByReceiver = async (receiver: string) => {
  const response = await apiClient.get(`/messages/receiver/${receiver}`);
  console.log('Get messages by receiver', response);
  return response;
};

export const getMessagesBySenderAndReceiver = async (
  sender: string,
  receiver: string,
) => {
  const response = await apiClient.get(
    `/messages/sender/${sender}/receiver/${receiver}`,
  );
  console.log('Get messages by sender and receiver', response);
  return response;
};

export const deleteMessage = async (id: number) => {
  const response = await apiClient.delete(`/messages/id/${id}`);
  console.log('Delete message', response);
  return response;
};

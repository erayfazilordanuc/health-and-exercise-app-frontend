import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../axios/axios';
import NetInfo from '@react-native-community/netinfo';

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
  try {
    const response = await apiClient.get(
      `/messages/room/sender/${sender}/receiver/${receiver}`,
    );

    if (response.status >= 200 && response.status < 300) {
      console.log('Is room exist by sender and receiver', response);
      return response.data;
    } else return 0;
  } catch (error) {
    console.log(error);
    return 0;
  }
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

// export const getMessagesBySender = async (sender: string) => {
//   const response = await apiClient.get(`/messages/sender/${sender}`);
//   console.log('Get messages by sender', response);
//   return response;
// };

// export const getMessagesByReceiver = async (receiver: string) => {
//   const response = await apiClient.get(`/messages/receiver/${receiver}`);
//   console.log('Get messages by receiver', response);
//   return response;
// };

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

const normalize = (m: Message) => {
  if (m.message && m.message.startsWith('dailyStatus')) {
    const match = m.message.match(/dailyStatus(\d+)/);
    const score = parseInt(match![1], 10);

    m.message =
      '\n' +
      new Date().toLocaleDateString() +
      `\nBugün ruh halimi ${score}/9 olarak değerlendiriyorum.`;
  }
  return m;
};

export const getLastMessageBySenderAndReceiver = async (
  sender: string,
  receiver: string,
) => {
  const localJson = await AsyncStorage.getItem(
    `lastMessage_${sender}_${receiver}`,
  );
  console.log(
    'burada1',
    `lastMessage_${sender}_${receiver}`,
    `lastMessage_${receiver}_${sender}`,
  );
  let local, local2;

  if (localJson) {
    local = JSON.parse(localJson);
  }

  const localJson2 = await AsyncStorage.getItem(
    `lastMessage_${receiver}_${sender}`,
  );
  if (localJson2) {
    local2 = JSON.parse(localJson2);
  }
  console.log('burada1');
  if (local && local2)
    if (local2.savedAt > local.savedAt) return normalize(local2.message);
    else return normalize(local.message);

  if (local) return normalize(local.message);
  if (local2) return normalize(local2.message);

  const net = await NetInfo.fetch();
  if (!net.isConnected) return;

  const s = encodeURIComponent(sender);
  const r = encodeURIComponent(receiver);
  const res = await apiClient.get(`/messages/sender/${s}/receiver/${r}/last`);
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Unexpected status: ${res.status}`);
  }

  AsyncStorage.setItem(
    `lastMessage_${sender}_${receiver}`,
    JSON.stringify({
      message: res.data as Message,
      savedAt: new Date(),
    } as LocalMessage),
  );
  return normalize(res.data as Message);
};

export const isDailyStatusExistForToday = async (
  sender: string,
  receiver: string,
) => {
  const response = await apiClient.get(
    `/messages/exists/sender/${sender}/receiver/${receiver}/today/daily-status`,
  );
  console.log(
    'Is daily status exists for today by sender and receiver',
    response,
  );
  return response;
};

export const deleteMessage = async (id: number) => {
  const response = await apiClient.delete(`/messages/id/${id}`);
  console.log('Delete message', response);
  return response;
};

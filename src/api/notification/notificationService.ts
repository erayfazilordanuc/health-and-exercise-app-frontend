import apiClient from '../axios/axios';

export const saveFCMToken = async (fcmTokenPayload: FCMToken) => {
  const response = await apiClient.post(
    `/notifications/user/fcm-token`,
    fcmTokenPayload,
  );
  console.log('Save fcm token', response);
  return response;
};

export const sendNotification = async (receiver: string, message: string) => {
  const response = await apiClient.post(`/notifications/send`, {
    receiver: receiver,
    message: message,
  });
  console.log('Send notification', response);
  return response;
};

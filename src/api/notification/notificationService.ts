import apiClient from '../axios/axios';

export const saveFCMToken = async (fcmTokenPayload: FCMToken) => {
  const response = await apiClient.post(
    `/notifications/user/fcm-token`,
    fcmTokenPayload,
  );
  console.log('Save fcm token', response);
  return response;
};

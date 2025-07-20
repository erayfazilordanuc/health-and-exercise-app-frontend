import apiClient from '../axios/axios';

export const getAchievementsByUserId = async (userId: number) => {
  try {
    const response = await apiClient.get(`/users/${userId}/achievements`);
    console.log('get achievements by user id', response);

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      console.error('Unexpected status code:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return [];
  }
};

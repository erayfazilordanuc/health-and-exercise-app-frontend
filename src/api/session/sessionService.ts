import apiClient from '../axios/axios';

export const getMySessions = async (from: string, to: string) => {
  try {
    const response = await apiClient.get('/sessions/me', {params: {from, to}});
    console.log('get my sessions', response);

    if (response.status >= 200 && response.status < 300) {
      return response.data as SessionDTO[];
    } else {
      console.error('Unexpected status code:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return [];
  }
};

export const getUserSessions = async (
  userId: number,
  from: string,
  to: string,
) => {
  try {
    const response = await apiClient.get(`/sessions/users/${userId}`, {
      params: {from, to},
    });
    console.log('get user sessions', response);

    if (response.status >= 200 && response.status < 300) {
      return response.data as SessionDTO[];
    } else {
      console.error('Unexpected status code:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return [];
  }
};

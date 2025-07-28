import apiClient from '../axios/axios';

export const progressExercise = async (
  exerciseId: number,
  progressRatio: number,
) => {
  try {
    const response = await apiClient.put(
      `/exercises/${exerciseId}/progress/${progressRatio}`,
    );
    console.log('progress exercise', response);

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

export const getWeeklyActiveDaysProgress = async () => {
  try {
    const response = await apiClient.get(
      `/exercises/weekly-active-days/progress`,
    );
    console.log('weekly active days exercise progress', response);

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

export const getWeeklyActiveDaysProgressByUserId = async (userId: number) => {
  try {
    const response = await apiClient.get(
      `/exercises/weekly-active-days/progress/${userId}`,
    );
    console.log('weekly active days exercise progress by user id', response);

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

export const getTodaysProgress = async () => {
  try {
    const response = await apiClient.get(`/exercises/daily/progress`);
    console.log('daily progress', response);

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

export const getTodaysProgressByUserId = async (userId: number) => {
  try {
    const response = await apiClient.get(`/exercises/daily/progress/${userId}`);
    console.log('daily progress by user id', response);

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

export const getProgressByDate = async (date: Date) => {
  try {
    const dateVariable = date.toISOString().slice(0, 10);
    const response = await apiClient.get(
      `/exercises/date/${dateVariable}/progress`,
    );
    console.log('progress by date', response);

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

export const deleteProgress = async (exerciseId: number, date: Date) => {
  try {
    const dateVariable = date.toISOString().slice(0, 10);
    const response = await apiClient.delete(
      `/exercises/${exerciseId}/date/${dateVariable}/progress`,
    );
    console.log('delete progress', response);

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

// export const getAchievementsByUserId = async (userId: number) => {
//   try {
//     const response = await apiClient.get(`/users/${userId}/achievements`);
//     console.log('get achievements by user id', response);

//     if (response.status >= 200 && response.status < 300) {
//       return response.data;
//     } else {
//       console.error('Unexpected status code:', response.status);
//       return [];
//     }
//   } catch (error) {
//     console.error('Error fetching exercises:', error);
//     return [];
//   }
// };

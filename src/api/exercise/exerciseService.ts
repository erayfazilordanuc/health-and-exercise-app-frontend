import {Asset} from 'react-native-image-picker';
import apiClient from '../axios/axios';
import RNBlob from 'react-native-blob-util';
import {AxiosError} from 'axios';
import {ExercisePosition} from '../../types/enums';

export const getAllExercises = async () => {
  try {
    const response = await apiClient.get('/exercises');
    console.log('get all exercises', response);

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

export const getExerciseById = async (id: number) => {
  try {
    const response = await apiClient.get(`/exercises/${id}`);
    console.log('get exercise by id', response);

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

export const getTodayExerciseByPosition = async (
  position: ExercisePosition,
) => {
  try {
    const response = await apiClient.get(`/exercises/today`, {
      params: {position: ExercisePosition[position]},
    });
    console.log('today exercise', response);

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

// For future implementations
// backend flow: find group by user, find admin by group, find exercise by admin and return it...
export const getTodayExerciseByGroup = async (position: ExercisePosition) => {
  try {
    const response = await apiClient.get(`/exercises/today`, {
      params: {position: ExercisePosition[position]},
    });
    console.log('today exercise', response);

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

export const getAverageExercisePulseByDate = async (
  dateStr: string,
): Promise<number | null> => {
  const res = await apiClient.get(`/exercises/date/${dateStr}/pulse`);
  const v = res.data;
  if (v === null || v === undefined) return null;
  return typeof v === 'number' ? v : Number(v);
};

export const createExercise = async (createExerciseDTO: CreateExerciseDTO) => {
  try {
    console.log('create DTO', createExerciseDTO);
    const response = await apiClient.post(`/exercises`, createExerciseDTO);
    console.log('Create exercise', response);
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      console.error('Unexpected status code:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return null;
  }
};

export const updateExercise = async (
  id: number,
  updateExerciseDTO: UpdateExerciseDTO,
) => {
  try {
    const response = await apiClient.put(`/exercises/${id}`, updateExerciseDTO);
    console.log('Update exercise', response);
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      console.error('Unexpected status code:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return null;
  }
};

export const deleteExercise = async (exerciseId: number) => {
  try {
    const response = await apiClient.delete(`/exercises/${exerciseId}`);
    console.log('Delete exercise', response);
    if (response.status >= 200 && response.status < 300) {
      return response;
    } else {
      console.error('Unexpected status code:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error deleting exercises:', error);
    return null;
  }
};

export const getPresignedUrl = async (exerciseId: number, fileName: string) => {
  try {
    const response = await apiClient.get(
      `/exercises/${exerciseId}/videos/presign`,
      {params: {fileName}},
    );
    console.log('get presigned url', response);

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      console.error('Unexpected status code:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return null;
  }
};

export const uploadVideoToS3 = async (
  url: string,
  asset: Asset,
  onProgress: (p: number) => void,
): Promise<string> => {
  if (!asset.uri!.startsWith('file://')) {
    throw new Error('URI dosya yoluna işaret etmiyor');
  }

  const mime = asset.type ?? 'video/mp4';
  const headers: Record<string, string> = {'Content-Type': mime};

  const response = await RNBlob.fetch(
    'PUT',
    url,
    headers,
    RNBlob.wrap(asset.uri!.replace('file://', '')),
  ).uploadProgress({interval: 250}, (sent, total) => {
    if (onProgress && total) {
      onProgress(Math.round((sent / total) * 100));
    }
  });

  const status = response.info().status;
  if (status < 200 || status >= 300) {
    console.warn('S3 error body:', response.text());
    throw new Error(`S3 upload failed (${status})`);
  }

  return url.split('?')[0];
};

export const addVideoToExercise = async (
  exerciseId: number,
  newVideoDTO: NewVideoDTO,
): Promise<ExerciseDTO> => {
  return apiClient
    .post(`/exercises/${exerciseId}/videos`, newVideoDTO)
    .then(({data}) => {
      console.log('✅ Video başarıyla eklendi:', data);
      return data as ExerciseDTO;
    })
    .catch((err: AxiosError<any>) => {
      const {response} = err;

      const message =
        response?.data?.message || response?.data?.error || err.message;
      console.error('🚨 Video eklenirken hata:', message, response);

      throw {response, message};
    });
};

export const updateExerciseVideoName = async (
  videoId: number,
  exerciseId: number,
  videoName: string,
): Promise<ExerciseDTO> => {
  const videoDTO: NewVideoDTO = {
    name: videoName,
    videoUrl: null,
    durationSeconds: null,
  };
  return apiClient
    .put(`/exercises/${exerciseId}/videos/id/${videoId}`, videoDTO)
    .then(({data}) => {
      console.log('✅ Video başarıyla eklendi:', data);
      return data as ExerciseDTO;
    })
    .catch((err: AxiosError<any>) => {
      const {response} = err;

      const message =
        response?.data?.message || response?.data?.error || err.message;
      console.error('🚨 Video kaydederken hata:', message, response);

      throw {response, message};
    });
};

export const deleteVideoFromExercise = async (
  id: number,
  exerciseId: number,
) => {
  try {
    const response = await apiClient.delete(
      `/exercises/${exerciseId}/videos/id/${id}`,
    );
    console.log('Delete video from exercise', response);
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      console.error('Unexpected status code:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error deleting exercises:', error);
    return null;
  }
};

export const calcPercent = (p?: ExerciseProgressDTO | null): number => {
  console.log('dto', p);

  if (
    !p ||
    !p.exerciseDTO ||
    !p.exerciseDTO.videos ||
    !p.videoProgress ||
    p.videoProgress.length === 0
  )
    return 0;
  console.log('p.total', p.totalProgressDuration);

  let allDone = true;
  for (const vp of p.videoProgress) {
    if (!vp.isCompeleted) allDone = false;
  }
  if (allDone) return 100;

  const total = p.exerciseDTO.videos.reduce(
    (sum, v) => sum + (v.durationSeconds ?? 0),
    0,
  );
  console.log('total', total);
  console.log(
    'result percent',
    total === 0 ? 0 : Math.round((p.totalProgressDuration / total) * 100),
  );

  let result =
    total === 0 ? 0 : Math.round((p.totalProgressDuration / total) * 100);

  if (result === 100) {
    for (const vp of p.videoProgress) if (!vp.isCompeleted) return 99;
  }

  return result;
};

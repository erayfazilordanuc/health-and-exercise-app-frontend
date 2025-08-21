import {useQuery, QueryClient, queryOptions} from '@tanstack/react-query';
import type {AxiosError} from 'axios';
import apiClient from '../api/axios/axios';
import {useMutation, useQueryClient} from '@tanstack/react-query';

export const createExercise = async (createExerciseDTO: CreateExerciseDTO) => {
  try {
    console.log('create DTO', createExerciseDTO);
    const response = await apiClient.post(`/exercises`, createExerciseDTO);
    console.log('Create exercise', response);

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    console.error('Error creating exercise:', error);
    throw error;
  }
};

const EX_ALL_QK = ['exercises', 'all'] as const;

export const useCreateExercise = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createExercise,
    onSuccess: () => {
      qc.invalidateQueries({queryKey: EX_ALL_QK, exact: true});
    },
  });
};

const fetchAllExercises = async (): Promise<Exercise[]> => {
  const res = await apiClient.get<Exercise[]>('/exercises');
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Unexpected status code: ${res.status}`);
  }
  return res.data;
};

export const useAllExercises = () =>
  useQuery<Exercise[], AxiosError, Exercise[], typeof EX_ALL_QK>({
    queryKey: EX_ALL_QK,
    queryFn: fetchAllExercises,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

export const invalidateAllExercises = (qc: QueryClient) =>
  qc.invalidateQueries({queryKey: EX_ALL_QK});

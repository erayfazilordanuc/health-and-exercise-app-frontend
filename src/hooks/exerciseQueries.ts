import {
  useQuery,
  QueryClient,
  queryOptions,
  UseQueryOptions,
  keepPreviousData,
} from '@tanstack/react-query';
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

async function fetchMyExerciseSchedule(): Promise<number[]> {
  const {data} = await apiClient.get<number[]>('/exercises/schedule');
  return data;
}

// --- PUT: upsert exercise schedule ---
async function upsertSchedule(activeDays: number[]): Promise<number[]> {
  const {data} = await apiClient.put<number[]>(
    '/exercises/schedule',
    {activeDays}, // { activeDays: number[] }
  );
  return data;
}

// --- Query Hook (uzun staleTime) ---
export function useExerciseSchedule() {
  return useQuery({
    queryKey: ['exerciseSchedule'],
    queryFn: fetchMyExerciseSchedule,
    staleTime: 1000 * 60 * 5, // 12 saat
    gcTime: 1000 * 60 * 60 * 24, // 24 saat cache'te tut
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 0,
  });
}

// --- Mutation Hook ---
export function useUpsertExerciseSchedule() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: upsertSchedule,
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['exerciseSchedule']});
    },
  });
}

export const scheduleQueryKey = (userId?: number) =>
  ['exerciseScheduleAdmin', userId] as const;

async function fetchExerciseScheduleForAdmin(
  userId: number,
): Promise<number[]> {
  const {data} = await apiClient.get<number[]>(`/exercises/schedule/${userId}`);
  return data;
}

// queryKey ve queryFn dışındaki opsiyonlara izin verelim
type UseExerciseScheduleAdminOptions = Omit<
  UseQueryOptions<
    number[],
    AxiosError,
    number[],
    ReturnType<typeof scheduleQueryKey>
  >,
  'queryKey' | 'queryFn'
>;

export function useExerciseScheduleAdmin(
  userId?: number,
  options?: UseExerciseScheduleAdminOptions,
) {
  const enabled = typeof userId === 'number' && (options?.enabled ?? true);

  return useQuery<
    number[],
    AxiosError,
    number[],
    ReturnType<typeof scheduleQueryKey>
  >({
    queryKey: scheduleQueryKey(userId),
    queryFn: () => fetchExerciseScheduleForAdmin(userId!), // enabled true iken güvenli
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    placeholderData: keepPreviousData, // 🔑 v5’te bununla önceki data korunur
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    ...options,
  });
}

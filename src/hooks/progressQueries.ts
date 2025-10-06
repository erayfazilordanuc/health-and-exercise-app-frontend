// src/hooks/useExerciseProgress.ts
import {
  keepPreviousData,
  QueryClient,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  type QueryKey,
} from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import apiClient from '../api/axios/axios';
import {
  getTodaysProgressByUserId,
  getWeeklyActiveDaysProgressByUserId,
} from '../api/exercise/progressService';
import {useEffect} from 'react';
import {AxiosError} from 'axios';

export const PROGRESS_KEYS = {
  root: ['progress'] as const,
  dashboard: (dateStr: string) =>
    [...PROGRESS_KEYS.root, 'dashboard', dateStr] as const,
  daily: () => [...PROGRESS_KEYS.root, 'daily'] as const,
  weeklyActiveDays: () =>
    [...PROGRESS_KEYS.root, 'weekly-active-days'] as const,
  byDate: (dateStr: string) =>
    [...PROGRESS_KEYS.root, 'by-date', dateStr] as const,
};

const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const todayKey = (dateStr: string) => `exerciseProgress_${dateStr}`;

async function getJSON<T>(url: string): Promise<T> {
  const res = await apiClient.get(url);
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Unexpected status code: ${res.status}`);
  }
  return res.data as T;
}

function normalizeProgress(raw: any, fallbackUserId = 0): ExerciseProgressDTO {
  const safeExerciseDTO: ExerciseDTO = {
    id: raw?.exerciseDTO?.id ?? null,
    name: raw?.exerciseDTO?.name ?? null,
    description: raw?.exerciseDTO?.description ?? null,
    point: raw?.exerciseDTO?.point ?? null,
    videos: Array.isArray(raw?.exerciseDTO?.videos)
      ? (raw.exerciseDTO.videos as ExerciseVideoDTO[])
      : [],
    adminId: raw?.exerciseDTO?.adminId ?? null,
    createdAt: raw?.exerciseDTO?.createdAt ?? null,
    updatedAt: raw?.exerciseDTO?.updatedAt ?? null,
  };

  const safeVideoProgress: ExerciseVideoProgressDTO[] = Array.isArray(
    raw?.videoProgress,
  )
    ? (raw.videoProgress as ExerciseVideoProgressDTO[])
    : [];

  return {
    userId: typeof raw?.userId === 'number' ? raw.userId : fallbackUserId,
    exerciseDTO: safeExerciseDTO,
    videoProgress: safeVideoProgress,
    totalProgressDuration:
      typeof raw?.totalProgressDuration === 'number'
        ? raw.totalProgressDuration
        : 0,
  };
}

const isSafe = (p: any): p is ExerciseProgressDTO =>
  p &&
  typeof p.userId === 'number' &&
  typeof p.totalProgressDuration === 'number' &&
  p.exerciseDTO &&
  Array.isArray(p.exerciseDTO.videos) &&
  Array.isArray(p.videoProgress);

const pickSafe = (p?: ExerciseProgressDTO | null) =>
  p && isSafe(p) ? p : null;

export function useTodaysProgressOfflineFirst(options?: {
  date?: Date;
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number | false;
  currentUserId?: number;
}) {
  const dateStr = toISODate(options?.date ?? new Date());
  const currentUserId = options?.currentUserId ?? 0;

  return useQuery({
    queryKey: [...PROGRESS_KEYS.daily(), dateStr] satisfies QueryKey,
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const net = await NetInfo.fetch();
      const isOnline = !!net.isConnected;

      const key = todayKey(dateStr);
      let localToday: ExerciseProgressDTO | null = null;
      try {
        const json = await AsyncStorage.getItem(key);
        if (json)
          localToday = normalizeProgress(JSON.parse(json), currentUserId);
      } catch {
        await AsyncStorage.removeItem(key);
        localToday = null;
      }

      let serverToday: ExerciseProgressDTO | null = null;
      if (isOnline) {
        try {
          const s = await getJSON<any>(`/exercises/daily/progress`);
          serverToday = normalizeProgress(s, currentUserId);
        } catch {}
      }

      const safeLocal = pickSafe(localToday);
      const safeServer = pickSafe(serverToday);

      let chosen: ExerciseProgressDTO | null = null;
      if (!safeServer && safeLocal) chosen = safeLocal;
      else if (safeServer && !safeLocal) chosen = safeServer;
      else if (safeServer && safeLocal) {
        chosen =
          (safeLocal.totalProgressDuration ?? 0) >
          (safeServer.totalProgressDuration ?? 0)
            ? safeLocal
            : safeServer;
      } else chosen = null;

      if (isOnline && chosen === safeServer && chosen) {
        try {
          await AsyncStorage.setItem(key, JSON.stringify(chosen));
        } catch {}
      }

      return {today: chosen, isOnline, dateStr};
    },
    staleTime: options?.staleTime ?? 300_000,
    refetchInterval: options?.refetchInterval ?? false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useWeeklyActiveDaysProgressOfflineAware(options?: {
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number | false;
  currentUserId?: number;
}) {
  const currentUserId = options?.currentUserId ?? 0;

  return useQuery({
    queryKey: PROGRESS_KEYS.weeklyActiveDays(),
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const net = await NetInfo.fetch();
      const isOnline = !!net.isConnected;
      if (!isOnline) return [] as ExerciseProgressDTO[];

      try {
        const w = await getJSON<any[]>(
          `/exercises/weekly-active-days/progress`,
        );
        return (w ?? []).map(item => normalizeProgress(item, currentUserId));
      } catch {
        return [] as ExerciseProgressDTO[];
      }
    },
    staleTime: options?.staleTime ?? 300_000,
    refetchInterval: options?.refetchInterval ?? false,
    // v5: 'ifStale' yerine true kullan
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export const EXERCISE_KEYS = {
  root: ['exercises'] as const,

  weeklyActiveDaysProgress: (userId: number, dateISO?: string) =>
    [
      ...EXERCISE_KEYS.root,
      'weekly-active-days',
      'progress',
      userId,
      dateISO,
    ] as const,
};

export function useWeeklyActiveDaysProgressByUserId(
  userId?: number,
  date?: Date,
  options?: Omit<
    UseQueryOptions<
      ExerciseProgressDTO[],
      AxiosError,
      ExerciseProgressDTO[],
      ReturnType<typeof EXERCISE_KEYS.weeklyActiveDaysProgress>
    >,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  const dateISO = date?.toISOString();

  return useQuery<
    ExerciseProgressDTO[],
    AxiosError,
    ExerciseProgressDTO[],
    ReturnType<typeof EXERCISE_KEYS.weeklyActiveDaysProgress>
  >({
    queryKey: EXERCISE_KEYS.weeklyActiveDaysProgress(userId ?? -1, dateISO),
    enabled: Number.isFinite(userId) && (userId as number) > 0 && !!dateISO,
    queryFn: () => getWeeklyActiveDaysProgressByUserId(userId as number, date),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    ...options,
  });
}

export const invalidateWeeklyActiveDaysProgress = (
  qc: QueryClient,
  userId: number,
) =>
  qc.invalidateQueries({
    queryKey: EXERCISE_KEYS.weeklyActiveDaysProgress(userId),
    exact: true,
  });

export const prefetchWeeklyActiveDaysProgress = (
  qc: QueryClient,
  userId: number,
) =>
  qc.prefetchQuery({
    queryKey: EXERCISE_KEYS.weeklyActiveDaysProgress(userId),
    queryFn: () => getWeeklyActiveDaysProgressByUserId(userId),
    staleTime: 5 * 60 * 1000,
  });

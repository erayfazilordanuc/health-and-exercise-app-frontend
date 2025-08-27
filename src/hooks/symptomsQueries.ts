import {
  keepPreviousData,
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import type {AxiosError} from 'axios';
import {
  adminGetSymptomsByUserIdAndDate,
  getLocal,
  getSymptomsByDate,
} from '../api/symptoms/symptomsService';
import {saveSymptoms} from '../lib/health/healthConnectService';
import {ymdLocal} from '../utils/dates';

export type Symptoms = {
  id?: number;
  pulse?: number;
  steps?: number;
  totalCaloriesBurned?: number | null;
  activeCaloriesBurned?: number | null;
  sleepMinutes?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

export const SYMPTOM_KEYS = {
  root: ['symptoms'] as const,

  byDate: (dateStr: string) =>
    [...SYMPTOM_KEYS.root, 'by-date', dateStr] as const,

  adminByUserAndDate: (userId: number, dateStr: string) =>
    [...SYMPTOM_KEYS.root, 'admin', 'user', userId, 'date', dateStr] as const,
};

export function useSaveSymptomsToday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (symptoms: Symptoms) => saveSymptoms(symptoms),
    onSuccess: (data, variables) => {
      const todayKey = ['symptoms', 'by-date', ymdLocal(new Date())];
      qc.setQueryData(todayKey, data ?? variables);
    },
  });
}

/**
 * Admin: Belirli kullanıcı + tarih için semptomları getirir.
 * - userId veya date yoksa fetch etmez (enabled=false).
 * - response.data `Symptoms` tipindedir.
 */
export function useAdminSymptomsByUserIdAndDate(
  userId?: number,
  date?: Date,
  options?: Omit<
    UseQueryOptions<
      Symptoms,
      AxiosError,
      Symptoms,
      ReturnType<typeof SYMPTOM_KEYS.adminByUserAndDate>
    >,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  const dateStr = date ? toISODate(date) : '';

  return useQuery<
    Symptoms,
    AxiosError,
    Symptoms,
    ReturnType<typeof SYMPTOM_KEYS.adminByUserAndDate>
  >({
    queryKey: SYMPTOM_KEYS.adminByUserAndDate(userId ?? -1, dateStr),
    enabled: !!userId && !!date,
    queryFn: async () => {
      if (!userId || !date) throw new Error('userId/date required');
      const res = await adminGetSymptomsByUserIdAndDate(userId, date);
      return res.data as Symptoms;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useSymptomsByDate(
  date: Date,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number | false;
  },
) {
  // 🔒 lokal günü sabitle (UTC kaymasını engelle)
  const dateStr = date ? ymdLocal(date) : '';

  return useQuery<Symptoms | null, Error>({
    queryKey: ['symptoms', 'by-date', dateStr],
    enabled: !!date && (options?.enabled ?? true),

    queryFn: async (): Promise<Symptoms | null> => {
      const local = await getLocal(dateStr); // ← d kullan
      if (local) return local;
      const synced = await getSymptomsByDate(dateStr); // ← d kullan
      return synced ?? null;
    },

    networkMode: 'always',
    staleTime: options?.staleTime ?? 60_000,
    refetchInterval: options?.refetchInterval ?? false,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 0,
  });
}

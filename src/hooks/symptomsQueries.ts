import {
  keepPreviousData,
  QueryKey,
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
  date?: Date,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number | false;
  },
) {
  const qc = useQueryClient();
  const dateStr = date?.toISOString().slice(0, 10);

  return useQuery<Symptoms, Error>({
    queryKey: dateStr
      ? ['symptoms', 'by-date', dateStr]
      : (['__disabled__'] as const),
    enabled: !!date && (options?.enabled ?? true),

    // HER ZAMAN Symptoms döndür!
    queryFn: async (): Promise<Symptoms> => {
      const local = await getLocal();
      if (local) return local; // hızlı dönüş
      const synced = await getSymptomsByDate(date ?? new Date());
      if (synced) return synced;
      return {} as Symptoms;
    },

    // async initialData KULLANMA!
    // initialData: () => getLocalSymptomsByDate(dateStr!) ❌

    // İstersen önceki cache’i göster:
    // placeholderData: () =>
    //   (dateStr ? qc.getQueryData<Symptoms>(['symptoms', 'by-date', dateStr]) : undefined),

    networkMode: 'always',
    staleTime: options?.staleTime ?? 60_000,
    refetchInterval: options?.refetchInterval ?? false,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

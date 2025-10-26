import {
  keepPreviousData,
  QueryClient,
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import type {AxiosError} from 'axios';
import {
  adminGetDoneStepGoals,
  adminGetLatestSymptomsByUserIdAndDate,
  adminGetWeeklyStepGoal,
  adminGetWeeklySteps,
  completeStepGoal,
  createStepGoal,
  getDoneStepGoals,
  getLocal,
  getLatestSymptomsByDate,
  getWeeklyStepGoal,
  getWeeklyStepsTotal,
  adminGetSymptomsSummaryByDateRange,
  adminGetWeeklyStepGoalByRange,
  adminGetDoneStepGoalsUntil,
} from '../api/symptoms/symptomsService';
import {saveSymptoms} from '../lib/health/healthConnectService';
import {ymdLocal} from '../utils/dates';
import apiClient from '../api/axios/axios';

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

export const SYMPTOMS_KEYS = {
  root: ['symptoms'] as const,

  byDate: (dateStr: string) =>
    [...SYMPTOMS_KEYS.root, 'by-date', dateStr] as const,

  adminByUserAndDate: (userId: number, dateStr: string) =>
    [...SYMPTOMS_KEYS.root, 'admin', 'user', userId, 'date', dateStr] as const,

  adminRoot: () => [...SYMPTOMS_KEYS.root, 'admin'] as const,
  adminSummaryByRange: (userId: number, startISO?: string, endISO?: string) =>
    [
      ...SYMPTOMS_KEYS.adminRoot(),
      'summary',
      'by-range',
      userId,
      startISO,
      endISO,
    ] as const,
};

export function useSaveSymptomsToday() {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ['saveSymptomsToday'],
    mutationFn: (symptoms: Symptoms) => saveSymptoms(symptoms),

    onMutate: vars => {
      console.log('[saveSymptomsToday] onMutate -> payload:', vars);
    },
    onSuccess: async (data, variables) => {
      const todayKey = ['symptoms', 'by-date', ymdLocal(new Date())];

      const prev = qc.getQueryData<Symptoms>(todayKey);
      const next = data ?? variables;

      qc.setQueryData(todayKey, next);

      if (prev?.steps !== next?.steps) {
        await Promise.all([
          qc.invalidateQueries({queryKey: STEP_GOAL_KEYS.weekly()}),
          qc.invalidateQueries({queryKey: STEP_GOAL_KEYS.done()}),
        ]);
      }
    },
    onError: err => {
      console.log('[saveSymptomsToday] onError ->', err);
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
      ReturnType<typeof SYMPTOMS_KEYS.adminByUserAndDate>
    >,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  const dateStr = date ? toISODate(date) : '';

  return useQuery<
    Symptoms,
    AxiosError,
    Symptoms,
    ReturnType<typeof SYMPTOMS_KEYS.adminByUserAndDate>
  >({
    queryKey: SYMPTOMS_KEYS.adminByUserAndDate(userId ?? -1, dateStr),
    enabled: !!userId && !!date,
    queryFn: async () => {
      if (!userId || !date) throw new Error('userId/date required');
      const res = await adminGetLatestSymptomsByUserIdAndDate(userId, date);
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
      const synced = await getLatestSymptomsByDate(dateStr); // ← d kullan
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

export function useAdminSymptomsSummaryByDateRange(
  userId?: number,
  startDate?: Date,
  endDate?: Date,
  options?: Omit<
    UseQueryOptions<
      WeeklySymptomsSummary,
      AxiosError,
      WeeklySymptomsSummary,
      ReturnType<typeof SYMPTOMS_KEYS.adminSummaryByRange>
    >,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  // Key'lerde kullanılmak üzere ISO string'e çevir
  const startISO = startDate?.toISOString().slice(0, 10);
  const endISO = endDate?.toISOString().slice(0, 10);

  return useQuery<
    WeeklySymptomsSummary,
    AxiosError,
    WeeklySymptomsSummary,
    ReturnType<typeof SYMPTOMS_KEYS.adminSummaryByRange>
  >({
    queryKey: SYMPTOMS_KEYS.adminSummaryByRange(userId ?? -1, startISO, endISO),

    // enabled: Sadece tüm parametreler geçerliyse sorguyu çalıştır
    enabled:
      Number.isFinite(userId) &&
      (userId as number) > 0 &&
      startDate instanceof Date &&
      endDate instanceof Date,

    // queryFn: 'enabled' true ise bu fonksiyon çalışır
    // ve parametrelerin 'undefined' olmadığından eminiz.
    queryFn: () =>
      adminGetSymptomsSummaryByDateRange(
        userId as number,
        startDate as Date,
        endDate as Date,
      ),

    // Diğer admin hook'larınızdaki gibi ayarlar
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 30 * 60 * 1000, // 30 dakika
    retry: 1,
    refetchOnWindowFocus: false, // Admin paneli için genelde false iyidir
    ...options,
  });
}

// 3. Yardımcı (Helper) Fonksiyonlar
export const invalidateAdminSymptomsSummary = (
  qc: QueryClient,
  userId: number,
) =>
  qc.invalidateQueries({
    // Bu userId'ye ait tüm 'summary' sorgularını geçersiz kıl
    queryKey: SYMPTOMS_KEYS.adminSummaryByRange(userId),
  });

export const prefetchAdminSymptomsSummary = (
  qc: QueryClient,
  userId: number,
  startDate: Date,
  endDate: Date,
) => {
  const startISO = startDate.toISOString().slice(0, 10);
  const endISO = endDate.toISOString().slice(0, 10);

  return qc.prefetchQuery({
    queryKey: SYMPTOMS_KEYS.adminSummaryByRange(userId, startISO, endISO),
    queryFn: () =>
      adminGetSymptomsSummaryByDateRange(userId, startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });
};

export const STEP_GOAL_KEYS = {
  root: ['step-goal'] as const,
  weekly: () => [...STEP_GOAL_KEYS.root, 'weekly'] as const,
  done: () => [...STEP_GOAL_KEYS.root, 'done'] as const,
};

// WEEKLY (tek kayıt)
export const useWeeklyStepGoal = (options?: {enabled?: boolean}) => {
  return useQuery<StepGoalDTO, Error>({
    queryKey: STEP_GOAL_KEYS.weekly(),
    queryFn: getWeeklyStepGoal,
    enabled: options?.enabled ?? true,
    networkMode: 'offlineFirst',
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 0,
    placeholderData: keepPreviousData,
  });
};

// DONE listesi
export const useDoneStepGoals = (options?: {enabled?: boolean}) => {
  return useQuery<StepGoalDTO[], Error>({
    queryKey: STEP_GOAL_KEYS.done(),
    queryFn: getDoneStepGoals,
    enabled: options?.enabled ?? true,
    networkMode: 'offlineFirst',
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    placeholderData: keepPreviousData,
  });
};

// CREATE (goal belirle)
export const useCreateStepGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goal: number) => createStepGoal(goal),
    onSuccess: () => {
      // Weekly hedef değişmiş olabilir; done listesi de etkilenebilir
      qc.invalidateQueries({queryKey: STEP_GOAL_KEYS.weekly()});
      qc.invalidateQueries({queryKey: STEP_GOAL_KEYS.done()});
    },
  });
};

// COMPLETE (hedefi tamamla)
export const useCompleteStepGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => completeStepGoal(id),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: STEP_GOAL_KEYS.weekly()});
      qc.invalidateQueries({queryKey: STEP_GOAL_KEYS.done()});
    },
  });
};

export const WEEKLY_STEPS_KEYS = {
  weekly: (start: string, end: string) => ['weekly-steps', start, end] as const,
};

const startOfWeekLocalMonday = (ref = new Date()) => {
  const d = new Date(ref);
  const day = d.getDay(); // 0: Pzr, 1: Pzt, ...
  const off = day === 0 ? -6 : 1 - day; // Pazartesi
  d.setDate(d.getDate() + off);
  d.setHours(0, 0, 0, 0);
  return d;
};

export function useWeeklySteps() {
  const monday = startOfWeekLocalMonday(new Date());
  const startStr = ymdLocal(monday);
  const endStr = ymdLocal(new Date());

  return useQuery<number, Error>({
    queryKey: WEEKLY_STEPS_KEYS.weekly(startStr, endStr),
    networkMode: 'offlineFirst',
    staleTime: 60_000,
    gcTime: 15 * 60_000,
    retry: 1,
    queryFn: async () => {
      try {
        // ✅ Önce backend
        return await getWeeklyStepsTotal(startStr, endStr);
      } catch {
        // 🔁 Offline/failover: localden topla
        const days: string[] = [];
        const todayEod = new Date();
        todayEod.setHours(23, 59, 59, 999);
        for (
          let cur = new Date(monday);
          cur <= todayEod;
          cur.setDate(cur.getDate() + 1)
        ) {
          days.push(ymdLocal(cur));
        }
        const recs = await Promise.all(days.map(ds => getLocal(ds)));
        return recs.reduce((sum, r) => sum + (r?.steps ?? 0), 0);
      }
    },
  });
}

export const ADMIN_KEYS = {
  root: ['admin'] as const,
  weeklySteps: (userId: number) =>
    [...ADMIN_KEYS.root, 'steps', 'weekly', userId] as const,
  stepGoalWeekly: (userId: number) =>
    [...ADMIN_KEYS.root, 'step-goal', 'weekly', userId] as const,
  stepGoalWeeklyByRange: (userId: number, startDate: Date, endDate: Date) =>
    [
      ...ADMIN_KEYS.root,
      'step-goal',
      'weekly',
      'range',
      userId,
      startDate,
      endDate,
    ] as const,
  stepGoalDone: (userId: number) =>
    [...ADMIN_KEYS.root, 'step-goal', 'done', userId] as const,
  stepGoalDoneUntil: (userId: number, date: Date) =>
    [...ADMIN_KEYS.root, 'step-goal', 'done', 'until', userId, date] as const,
};

export const useAdminWeeklySteps = (
  userId: number,
  options?: {enabled?: boolean},
) => {
  return useQuery<number, Error>({
    queryKey: ADMIN_KEYS.weeklySteps(userId),
    queryFn: () => adminGetWeeklySteps(userId),
    enabled: (options?.enabled ?? true) && !!userId,
    networkMode: 'offlineFirst',
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useAdminWeeklyStepGoal = (
  userId: number,
  options?: {enabled?: boolean},
) => {
  return useQuery<StepGoalDTO, Error>({
    queryKey: ADMIN_KEYS.stepGoalWeekly(userId),
    queryFn: () => adminGetWeeklyStepGoal(userId),
    enabled: (options?.enabled ?? true) && !!userId,
    networkMode: 'offlineFirst',
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    placeholderData: keepPreviousData,
  });
};

export const useAdminGetStepGoalForRange = (
  userId: number,
  startDate: Date,
  endDate: Date,
  options?: {enabled?: boolean},
) => {
  return useQuery<StepGoalDTO, Error>({
    queryKey: ADMIN_KEYS.stepGoalWeeklyByRange(userId, startDate, endDate),
    queryFn: () => adminGetWeeklyStepGoalByRange(userId, startDate, endDate),
    enabled: (options?.enabled ?? true) && !!userId,
    networkMode: 'offlineFirst',
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    placeholderData: keepPreviousData,
  });
};

export const useAdminDoneStepGoals = (
  userId: number,
  options?: {enabled?: boolean},
) => {
  return useQuery<StepGoalDTO[], Error>({
    queryKey: ADMIN_KEYS.stepGoalDone(userId),
    queryFn: () => adminGetDoneStepGoals(userId),
    enabled: (options?.enabled ?? true) && !!userId,
    networkMode: 'offlineFirst',
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    placeholderData: keepPreviousData,
  });
};

export const useAdminDoneStepGoalsUntil = (
  userId: number,
  date: Date,
  options?: {enabled?: boolean},
) => {
  return useQuery<StepGoalDTO[], Error>({
    queryKey: ADMIN_KEYS.stepGoalDoneUntil(userId, date),
    queryFn: () => adminGetDoneStepGoalsUntil(userId, date),
    enabled: (options?.enabled ?? true) && !!userId,
    networkMode: 'offlineFirst',
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    placeholderData: keepPreviousData,
  });
};

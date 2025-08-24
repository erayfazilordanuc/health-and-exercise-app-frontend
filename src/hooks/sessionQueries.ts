// queries/useUserSessions.ts
import {useQuery, UseQueryOptions} from '@tanstack/react-query';
import type {AxiosError} from 'axios';
import {getUserSessions} from '../api/session/sessionService';

const SESSION_KEYS = {
  root: ['sessions'] as const,
  byUserRange: (userId: number, from: string, to: string) =>
    [...SESSION_KEYS.root, 'by-user-range', userId, from, to] as const,
};

type UseUserSessionsOptions = Omit<
  UseQueryOptions<
    SessionDTO[],
    AxiosError,
    SessionDTO[],
    ReturnType<typeof SESSION_KEYS.byUserRange>
  >,
  'queryKey' | 'queryFn' | 'enabled'
> & {
  enabled?: boolean;
};

export function useUserSessions(
  userId: number | undefined,
  from: string | undefined,
  to: string | undefined,
  options?: UseUserSessionsOptions,
) {
  const enabled =
    (options?.enabled ?? true) && Number.isFinite(userId) && !!from && !!to;

  return useQuery<
    SessionDTO[],
    AxiosError,
    SessionDTO[],
    ReturnType<typeof SESSION_KEYS.byUserRange>
  >({
    queryKey: SESSION_KEYS.byUserRange(userId ?? -1, from ?? '', to ?? ''),
    enabled,
    queryFn: async () =>
      await getUserSessions(
        userId!,
        `${from!}T00:00:00Z`,
        `${to!}T23:59:59.999Z`,
      ),
    // lezzet ayarları: istersen özelleştir
    staleTime: options?.staleTime ?? 2 * 60 * 1000, // 2 dk
    gcTime: options?.gcTime ?? 5 * 60 * 1000,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
    refetchOnReconnect: options?.refetchOnReconnect ?? true,
    retry: 1, // options?.retry ?? 1
    placeholderData: options?.placeholderData,
    select: options?.select, // örn: tarih parse etmek istersen burada mapleyebilirsin
  });
}

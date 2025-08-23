import {QueryClient, useQuery, UseQueryOptions} from '@tanstack/react-query';
import {getGroupAdmin, getUsersByGroupId} from '../api/group/groupService';
import type {AxiosError} from 'axios';
// import type { User } from '<<PROJENE_GÖRE_USER_TIPI_YOLU>>';

export const GROUP_KEYS = {
  root: ['groups'] as const,
  usersByGroupId: (groupId: number) =>
    [...GROUP_KEYS.root, 'users', groupId] as const,
  adminByGroupId: (groupId: number) =>
    [...GROUP_KEYS.root, 'admin', groupId] as const,
};

/* --------------------------- GROUP USERS (User[]) --------------------------- */

export const useGroupUsers = (
  groupId?: number,
  options?: Omit<
    UseQueryOptions<
      User[], // TQueryFnData
      AxiosError, // TError
      User[], // TData
      ReturnType<typeof GROUP_KEYS.usersByGroupId> // TQueryKey
    >,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) =>
  useQuery<
    User[],
    AxiosError,
    User[],
    ReturnType<typeof GROUP_KEYS.usersByGroupId>
  >({
    queryKey: GROUP_KEYS.usersByGroupId(groupId ?? -1),
    enabled: Number.isFinite(groupId) && (groupId as number) > 0,
    queryFn: () => getUsersByGroupId(groupId as number), // -> Promise<User[]>
    networkMode: 'offlineFirst', // offline'da cache'i göster
    staleTime: 5 * 60 * 1000, // 5 dk taze
    gcTime: 30 * 60 * 1000, // 30 dk GC
    retry: 1,
    refetchOnWindowFocus: false,
    ...options,
  });

export const invalidateGroupUsers = (qc: QueryClient, groupId: number) =>
  qc.invalidateQueries({
    queryKey: GROUP_KEYS.usersByGroupId(groupId),
    exact: true,
  });

export const prefetchGroupUsers = (qc: QueryClient, groupId: number) =>
  qc.prefetchQuery({
    queryKey: GROUP_KEYS.usersByGroupId(groupId),
    queryFn: () => getUsersByGroupId(groupId),
    staleTime: 5 * 60 * 1000,
  });

/* --------------------------- GROUP ADMIN (User) ---------------------------- */

export function useGroupAdminByGroupId(
  groupId?: number,
  options?: Omit<
    UseQueryOptions<
      User | null, // TQueryFnData
      AxiosError, // TError
      User | null, // TData
      ReturnType<typeof GROUP_KEYS.adminByGroupId> // TQueryKey
    >,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  return useQuery<
    User | null,
    AxiosError,
    User | null,
    ReturnType<typeof GROUP_KEYS.adminByGroupId>
  >({
    queryKey: GROUP_KEYS.adminByGroupId(groupId ?? -1),
    enabled: Number.isFinite(groupId) && (groupId as number) > 0,
    queryFn: () => getGroupAdmin(groupId as number), // -> Promise<User | null>
    networkMode: 'offlineFirst',
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    ...options,
  });
}

export const invalidateGroupAdmin = (qc: QueryClient, groupId: number) =>
  qc.invalidateQueries({
    queryKey: GROUP_KEYS.adminByGroupId(groupId),
    exact: true,
  });

export const prefetchGroupAdmin = (qc: QueryClient, groupId: number) =>
  qc.prefetchQuery({
    queryKey: GROUP_KEYS.adminByGroupId(groupId),
    queryFn: () => getGroupAdmin(groupId),
    staleTime: 5 * 60 * 1000,
  });

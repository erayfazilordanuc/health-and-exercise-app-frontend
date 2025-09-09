import {
  keepPreviousData,
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import {
  getGroupAdmin,
  getGroupById,
  getUsersByGroupId,
  updateGroup,
} from '../api/group/groupService';
import type {AxiosError} from 'axios';
// import type { User } from '<<PROJENE_GÖRE_USER_TIPI_YOLU>>';

export const GROUP_KEYS = {
  root: ['groups'] as const,
  list: () => [...GROUP_KEYS.root, 'list'] as const,
  byId: (id: number) => ['group', id] as const,
  usersByGroupId: (groupId: number) =>
    [...GROUP_KEYS.root, 'users', groupId] as const,
  adminByGroupId: (groupId: number) =>
    [...GROUP_KEYS.root, 'admin', groupId] as const,
};

export const useGroupById = (
  id?: number,
  options?: Omit<
    UseQueryOptions<Group, AxiosError, Group, ReturnType<typeof GROUP_KEYS.byId>>,
    'queryKey' | 'queryFn' | 'enabled'
  > & { enabled?: boolean }
) =>
  useQuery<Group, AxiosError, Group, ReturnType<typeof GROUP_KEYS.byId>>({
    queryKey: GROUP_KEYS.byId(id ?? -1),
    enabled: Number.isFinite(id) && (id as number) > 0 && (options?.enabled ?? true),
    queryFn: async () => {
      const res = await getGroupById(id as number);
      return res.data as Group;
    },
    networkMode: 'offlineFirst',
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    ...options,
  });

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

export const useUpdateGroup = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateGroupDTO) => updateGroup(dto), // bu axios Response döndürüyor
    // Optimistic update (tek grup cache’ini anında güncelle)
    onMutate: async dto => {
      await qc.cancelQueries({queryKey: GROUP_KEYS.byId(dto.id)});
      const prev = qc.getQueryData<Group>(GROUP_KEYS.byId(dto.id));

      if (prev) {
        const next: Group = {
          ...prev,
          ...(dto.name !== undefined ? {name: dto.name} : {}),
          ...(dto.exerciseEnabled !== undefined
            ? {exerciseEnabled: dto.exerciseEnabled}
            : {}),
        };
        qc.setQueryData(GROUP_KEYS.byId(dto.id), next);
      }
      return {prev};
    },
    onError: (_err, dto, ctx) => {
      // rollback
      if (ctx?.prev) qc.setQueryData(GROUP_KEYS.byId(dto.id), ctx.prev);
    },
    onSuccess: (res, dto) => {
      // server’dan dönen kesin veriyi cache’e yaz (axios response -> data)
      const data = (res as any)?.data as Group | undefined;
      if (data?.id) qc.setQueryData(GROUP_KEYS.byId(data.id), data);
      else qc.invalidateQueries({queryKey: GROUP_KEYS.byId(dto.id)});
    },
    onSettled: (_res, _err, dto) => {
      // liste ve ilişkili query’leri tazele
      qc.invalidateQueries({queryKey: GROUP_KEYS.list()});
      if (dto?.id) {
        qc.invalidateQueries({queryKey: GROUP_KEYS.usersByGroupId(dto.id)});
        qc.invalidateQueries({queryKey: GROUP_KEYS.adminByGroupId(dto.id)});
      }
    },
  });
};

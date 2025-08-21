import {useQuery, UseQueryOptions} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import {getUserById} from '../api/user/userService';

export const USER_KEYS = {
  root: ['users'] as const,
  byId: (id: number) => [...USER_KEYS.root, 'by-id', id] as const,
};

export function useUserById(
  id?: number,
  options?: Omit<
    UseQueryOptions<
      User | null,
      AxiosError,
      User | null,
      ReturnType<typeof USER_KEYS.byId>
    >,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  return useQuery<
    User | null,
    AxiosError,
    User | null,
    ReturnType<typeof USER_KEYS.byId>
  >({
    queryKey: USER_KEYS.byId(id ?? -1),
    queryFn: () => getUserById(id!),
    enabled: Number.isFinite(id),
    ...options,
  });
}

import {useQuery} from '@tanstack/react-query';
import {getUsersByGroupId} from '../api/group/groupService';

export const useGroupUsers = (groupId?: number) => {
  return useQuery({
    queryKey: ['groupUsers', groupId],
    queryFn: () => getUsersByGroupId(groupId!),
    enabled: !!groupId,
  });
};

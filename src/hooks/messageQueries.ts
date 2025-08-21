import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useQuery} from '@tanstack/react-query';
import {
  getMessagesByRoomId,
  isRoomExistBySenderAndReceiver,
  saveMessage,
} from '../api/message/messageService';
import {socketService} from '../api/socket/socketService';
import {AxiosError} from 'axios';
import apiClient from '../api/axios/axios';
export const MSG_KEYS = {
  root: ['messages'] as const,
  byRoom: (roomId: number) => [...MSG_KEYS.root, 'room', roomId] as const,
  roomIdByUsers: (sender: string, receiver: string) =>
    [...MSG_KEYS.root, 'room-id', sender, receiver] as const,
};

export async function getRoomIdByUsers(
  sender: string,
  receiver: string,
): Promise<number> {
  const {data} = await apiClient.get(
    `/messages/room/sender/${sender}/receiver/${receiver}`,
  );
  const roomId = typeof data === 'number' ? data : data?.roomId;
  if (typeof roomId !== 'number') throw new Error('Geçersiz roomId');
  return roomId;
}

export function useRoomMessages(roomId: number) {
  return useQuery<Message[]>({
    queryKey: MSG_KEYS.byRoom(roomId),
    queryFn: async () => {
      const res = await getMessagesByRoomId(roomId);
      return res.status >= 200 && res.status < 300
        ? (res.data as Message[])
        : [];
    },
    // Ekranda iken spontane refetch istemiyoruz
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,

    // "Stale ise" değil; "invalidated ise" mount'ta refetch et:
    // v5'te refetchOnMount fonksiyon alabiliyor
    refetchOnMount: q => (q.state.isInvalidated ? true : false),

    // "Her şeyi stale say" davranışını kapat
    staleTime: Infinity, // cache'i taze tut; invalidation olursa zaten refetch olacak
    gcTime: 5 * 60_000,
    placeholderData: [],
  });
}

export function useSendMessage({
  roomId,
  sender,
  receiver,
  accessToken,
}: {
  roomId: number;
  sender: string;
  receiver: string;
  accessToken?: string;
}) {
  const qc = useQueryClient();
  return useMutation({
    // Burada payload Message objesi
    mutationFn: async (msg: Message) => {
      // 1) DB’ye kaydet
      await saveMessage(msg);

      // 2) socket
      socketService.emit('send_message', {
        messageWithSender: msg,
        room: roomId,
        accessToken,
      });

      return msg;
    },

    // Optimistic update (cache ve UI aynı anda güncellensin)
    onMutate: async msg => {
      const key = MSG_KEYS.byRoom(roomId);
      await qc.cancelQueries({queryKey: key});
      const previous = qc.getQueryData<Message[]>(key) ?? [];
      qc.setQueryData<Message[]>(key, (old = []) => [...old, msg]);
      return {previous};
    },

    onError: (_err, _msg, ctx) => {
      const key = MSG_KEYS.byRoom(roomId);
      if (ctx?.previous) qc.setQueryData<Message[]>(key, ctx.previous);
    },

    onSettled: () => {
      // Aktif ekranda iken refetch YAPMA, sadece stale yap:
      qc.invalidateQueries({
        queryKey: MSG_KEYS.byRoom(roomId),
        refetchType: 'none',
      });
      // Not: Remount edildiğinde query stale olduğundan otomatik fetch eder.
    },
  });
}

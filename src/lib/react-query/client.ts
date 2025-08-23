import AsyncStorage from '@react-native-async-storage/async-storage';
import {QueryClient} from '@tanstack/react-query';
import {persistQueryClient} from '@tanstack/react-query-persist-client';
import {createAsyncStoragePersister} from '@tanstack/query-async-storage-persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 120_000, // 2 dk taze
      gcTime: 5 * 60_000, // 5 dk sonra GC
      retry: 1,
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst', // offline'da var olan cache'i göster
    },
    mutations: {retry: 0},
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'RQ_CACHE_V1',
  throttleTime: 1000,
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün boyunca sakla
  dehydrateOptions: {
    shouldDehydrateQuery: q => q.state.status === 'success',
  },
});

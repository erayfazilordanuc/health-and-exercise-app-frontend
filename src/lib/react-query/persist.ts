import AsyncStorage from '@react-native-async-storage/async-storage';
import {persistQueryClient} from '@tanstack/react-query-persist-client';
import {createAsyncStoragePersister} from '@tanstack/query-async-storage-persister';
import {queryClient} from './client';

export const setupPersist = () => {
  const persister = createAsyncStoragePersister({ storage: AsyncStorage });
  persistQueryClient({
    queryClient,
    persister,
    maxAge: 24 * 60 * 60 * 1000, // 1 gün
  });
};
import {QueryClient} from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 120_000, // 10 sn taze
      gcTime: 5 * 60_000, // 5 dk sonra çöpe
      retry: 1, // 1 kez dene (mobil için makul)
      refetchOnWindowFocus: false, // RN’de genelde kapalı tut
    },
    mutations: {
      retry: 0, // kullanıcı aksiyonları için tekrar deneme genelde kapalı
    },
  },
});

import React, {useEffect, PropsWithChildren} from 'react';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from './client';
import {bindAppLifecycleToReactQuery} from './lifecycle';
import {setupPersist} from './persist'; // opsiyonel

export const ReactQueryProvider = ({children}: PropsWithChildren) => {
  useEffect(() => {
    bindAppLifecycleToReactQuery();
    // persist istersen aç
    setupPersist();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

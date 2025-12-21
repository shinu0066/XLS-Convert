"use client";

import { QueryClient } from '@tanstack/react-query';

/**
 * Configured React Query client with optimal caching defaults
 * - staleTime: 5 minutes - data is considered fresh for 5 minutes
 * - gcTime: 10 minutes - unused cache data is garbage collected after 10 minutes
 * - refetchOnWindowFocus: false - prevents unnecessary refetches on tab focus
 * - retry: 1 - retry failed requests once
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});


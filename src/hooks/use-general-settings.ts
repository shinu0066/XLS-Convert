"use client";

import { useQuery } from '@tanstack/react-query';
import { getGeneralSettings } from '@/lib/firebase-settings-service';
import type { GeneralSiteSettings } from '@/types/site-settings';

/**
 * React Query hook for fetching general site settings.
 * Provides automatic caching, refetching, and error handling.
 * 
 * Note: For real-time updates, use the useSettings() hook from settings-context instead.
 * This hook is useful for one-time fetches or when you need React Query's cache management.
 */
export function useGeneralSettings() {
  return useQuery<GeneralSiteSettings>({
    queryKey: ['generalSettings'],
    queryFn: getGeneralSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - cache persists for 10 minutes
  });
}


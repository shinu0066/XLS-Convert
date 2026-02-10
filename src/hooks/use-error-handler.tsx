/**
 * React hook for consistent error handling in components
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyErrorMessage, isProcessingCancelledError } from '@/types/errors';
import { logError } from '@/lib/error-handler';

interface UseErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  context?: Record<string, unknown>;
}

/**
 * Hook for handling errors in React components
 * Provides consistent error handling with toast notifications and logging
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { toast } = useToast();
  const { showToast = true, logError: shouldLog = true, context } = options;

  const handleError = useCallback(
    (error: unknown, customMessage?: string) => {
      // Don't show toast for cancelled operations
      if (isProcessingCancelledError(error)) {
        return;
      }

      // Log error if enabled
      if (shouldLog) {
        logError(error, context);
      }

      // Show toast if enabled
      if (showToast) {
        const message = customMessage || getUserFriendlyErrorMessage(error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: message,
          duration: 5000,
        });
      }
    },
    [toast, showToast, shouldLog, context]
  );

  return { handleError };
}


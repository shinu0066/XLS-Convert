/**
 * Error handling utilities for consistent error responses and logging
 */

import { NextResponse } from 'next/server';
import type { Response } from 'next/server';
import {
  getErrorMessage,
  getUserFriendlyErrorMessage,
  getErrorStatusCode,
  getErrorContext,
  isRetryableError,
  isProcessingCancelledError,
  type AppError,
} from '@/types/errors';

/**
 * Error context for logging
 */
export interface ErrorLogContext {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

/**
 * Logs error with context
 */
export function logError(
  error: unknown,
  context?: ErrorLogContext
): void {
  const errorContext = getErrorContext(error);
  const logData = {
    ...errorContext,
    ...context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };

  // In production, you might want to send this to an error tracking service
  // For now, we'll use console.error with structured data
  if (process.env.NODE_ENV === 'production') {
    // In production, log as JSON for better parsing
    console.error('[ERROR]', JSON.stringify(logData));
  } else {
    // In development, log with more detail
    console.error('[ERROR]', logData);
    if (error instanceof Error && error.stack) {
      console.error('[STACK]', error.stack);
    }
  }
}

/**
 * Creates a standardized API error response
 */
export function createErrorResponse(
  error: unknown,
  context?: ErrorLogContext
): Response {
  // Log the error
  logError(error, context);

  // Don't expose internal errors in production
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = getErrorStatusCode(error);
  const userMessage = getUserFriendlyErrorMessage(error);

  // For processing cancelled errors, return a specific status
  if (isProcessingCancelledError(error)) {
    return NextResponse.json(
      {
        error: 'Processing was cancelled',
        message: userMessage,
      },
      { status: 499 } // Client Closed Request
    );
  }

  // For client errors (4xx), include more detail
  if (statusCode >= 400 && statusCode < 500) {
    return NextResponse.json(
      {
        error: userMessage,
        code: 'code' in error && typeof error.code === 'string' ? error.code : undefined,
      },
      { status: statusCode }
    );
  }

  // For server errors (5xx), be more generic in production
  return NextResponse.json(
    {
      error: isProduction
        ? 'An internal server error occurred. Please try again later.'
        : userMessage,
      ...(isProduction ? {} : { details: getErrorContext(error) }),
    },
    { status: statusCode }
  );
}

/**
 * Wraps an async API route handler with error handling
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  context?: ErrorLogContext
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error: unknown) {
      return createErrorResponse(error, context);
    }
  }) as T;
}

/**
 * Handles errors in async functions with optional retry logic
 */
export async function handleAsyncError<T>(
  fn: () => Promise<T>,
  options?: {
    retries?: number;
    retryDelay?: number;
    onError?: (error: unknown, attempt: number) => void;
    context?: ErrorLogContext;
  }
): Promise<T> {
  const { retries = 0, retryDelay = 1000, onError, context } = options || {};
  let lastError: unknown;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      attempt++;

      // Don't retry if error is not retryable
      if (!isRetryableError(error) || attempt > retries) {
        if (onError) {
          onError(error, attempt);
        } else {
          logError(error, { ...context, attempt });
        }
        throw error;
      }

      // Wait before retrying
      if (attempt <= retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Safely executes a function and returns a result or error
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  context?: ErrorLogContext
): Promise<{ success: true; data: T } | { success: false; error: unknown; message: string }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error: unknown) {
    logError(error, context);
    return {
      success: false,
      error,
      message: getUserFriendlyErrorMessage(error),
    };
  }
}

/**
 * Validates and throws ValidationError if validation fails
 */
export function validateOrThrow(
  condition: boolean,
  message: string,
  field?: string,
  value?: unknown
): asserts condition {
  if (!condition) {
    const { ValidationError } = require('@/types/errors');
    throw new ValidationError(message, field, value);
  }
}


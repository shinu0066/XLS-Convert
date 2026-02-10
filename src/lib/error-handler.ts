/**
 * Error handling utilities for consistent error responses and logging
 */

import { NextResponse, type NextResponse as NextResponseType } from "next/server";
import {
  getUserFriendlyErrorMessage,
  getErrorStatusCode,
  getErrorContext,
  isRetryableError,
  isProcessingCancelledError,
} from "@/types/errors";

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
export function logError(error: unknown, context?: ErrorLogContext): void {
  const errorContext = getErrorContext(error);
  const logData = {
    ...errorContext,
    ...context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };

  if (process.env.NODE_ENV === "production") {
    console.error("[ERROR]", JSON.stringify(logData));
  } else {
    console.error("[ERROR]", logData);
    if (error instanceof Error && error.stack) {
      console.error("[STACK]", error.stack);
    }
  }
}

/**
 * Creates a standardized API error response
 */
export function createErrorResponse(
  error: unknown,
  context?: ErrorLogContext
): NextResponseType {
  // Log the error
  logError(error, context);

  const isProduction = process.env.NODE_ENV === "production";
  const statusCode = getErrorStatusCode(error);
  const userMessage = getUserFriendlyErrorMessage(error);

  // For processing cancelled errors, return a specific status
  if (isProcessingCancelledError(error)) {
    return NextResponse.json(
      {
        error: "Processing was cancelled",
        message: userMessage,
      },
      { status: 499 } // Client Closed Request
    );
  }

  // For client errors (4xx), include more detail
  if (statusCode >= 400 && statusCode < 500) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as any).code === "string"
        ? (error as any).code
        : undefined;

    return NextResponse.json(
      {
        error: userMessage,
        code,
      },
      { status: statusCode }
    );
  }

  // For server errors (5xx), be more generic in production
  return NextResponse.json(
    {
      error: isProduction
        ? "An internal server error occurred. Please try again later."
        : userMessage,
      ...(isProduction ? {} : { details: getErrorContext(error) }),
    },
    { status: statusCode }
  );
}

/**
 * Wraps an async API route handler with error handling
 */
export function withErrorHandler<
  T extends (...args: any[]) => Promise<NextResponseType>
>(handler: T, context?: ErrorLogContext): T {
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
        if (onError) onError(error, attempt);
        else logError(error, { ...context, attempt });
        throw error;
      }

      // Wait before retrying
      if (attempt <= retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * attempt)
        );
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
): Promise<
  | { success: true; data: T }
  | { success: false; error: unknown; message: string }
> {
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
    // Keeping require() because this function can be used in places where circular imports may happen
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ValidationError } = require("@/types/errors");
    throw new ValidationError(message, field, value);
  }
}

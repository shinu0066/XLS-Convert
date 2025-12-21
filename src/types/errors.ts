/**
 * Error type definitions and type guards for type-safe error handling
 */

import type { AuthError } from 'firebase/auth';
import type { FirebaseError as FirebaseSDKError } from 'firebase/app';

/**
 * Base application error interface
 */
export interface AppError extends Error {
  code?: string;
  cause?: unknown;
}

/**
 * Firebase Authentication error
 */
export interface FirebaseAuthError extends AppError {
  code: string;
  name: 'FirebaseError';
}

/**
 * Firebase Firestore/Storage error
 */
export interface FirebaseStorageError extends AppError {
  code: string;
  name: 'FirebaseError';
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends Error implements AppError {
  name = 'ValidationError' as const;
  field?: string;
  value?: unknown;
  code?: string;

  constructor(message: string, field?: string, value?: unknown) {
    super(message);
    this.field = field;
    this.value = value;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Environment configuration error
 */
export class EnvError extends Error implements AppError {
  name = 'EnvError' as const;
  variable?: string;
  code?: string;

  constructor(message: string, variable?: string) {
    super(message);
    this.variable = variable;
    Object.setPrototypeOf(this, EnvError.prototype);
  }
}

/**
 * Network/API error for failed network requests
 */
export class NetworkError extends Error implements AppError {
  name = 'NetworkError' as const;
  code?: string;
  statusCode?: number;
  url?: string;

  constructor(message: string, statusCode?: number, url?: string) {
    super(message);
    this.statusCode = statusCode;
    this.url = url;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Permission/Authorization error
 */
export class PermissionError extends Error implements AppError {
  name = 'PermissionError' as const;
  code = 'PERMISSION_DENIED';
  resource?: string;
  action?: string;

  constructor(message: string, resource?: string, action?: string) {
    super(message);
    this.resource = resource;
    this.action = action;
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}

/**
 * Not Found error for missing resources
 */
export class NotFoundError extends Error implements AppError {
  name = 'NotFoundError' as const;
  code = 'NOT_FOUND';
  resource?: string;
  id?: string;

  constructor(message: string, resource?: string, id?: string) {
    super(message);
    this.resource = resource;
    this.id = id;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Processing cancellation error
 */
export class ProcessingCancelledError extends Error {
  name = 'ProcessingCancelledError';
  constructor(message: string = 'Processing was cancelled') {
    super(message);
    Object.setPrototypeOf(this, ProcessingCancelledError.prototype);
  }
}

/**
 * Type guard to check if error is a ProcessingCancelledError
 */
export function isProcessingCancelledError(error: unknown): error is ProcessingCancelledError {
  return error instanceof ProcessingCancelledError;
}

/**
 * Type guard to check if error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if error is a Firebase AuthError
 */
export function isFirebaseAuthError(error: unknown): error is AuthError {
  return (
    isError(error) &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code.startsWith('auth/')
  );
}

/**
 * Type guard to check if error is a Firebase SDK error (Firestore, Storage, etc.)
 */
export function isFirebaseSDKError(error: unknown): error is FirebaseSDKError {
  return (
    isError(error) &&
    'code' in error &&
    typeof error.code === 'string' &&
    (error.code.startsWith('storage/') ||
     error.code.startsWith('firestore/') ||
     error.code.startsWith('functions/'))
  );
}

/**
 * Type guard to check if error has a code property
 */
export function isCodedError(error: unknown): error is AppError {
  return isError(error) && 'code' in error && typeof error.code === 'string';
}

/**
 * Type guard to check if error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Type guard to check if error is an EnvError
 */
export function isEnvError(error: unknown): error is EnvError {
  return error instanceof EnvError;
}

/**
 * Type guard to check if error is a NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Type guard to check if error is a PermissionError
 */
export function isPermissionError(error: unknown): error is PermissionError {
  return error instanceof PermissionError;
}

/**
 * Type guard to check if error is a NotFoundError
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

/**
 * Extracts error message from unknown error type
 * Handles Error instances, objects with message property, and strings
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
}

/**
 * Extracts error code from unknown error type if available
 */
export function getErrorCode(error: unknown): string | undefined {
  if (isCodedError(error)) {
    return error.code;
  }
  
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string') {
      return code;
    }
  }
  
  return undefined;
}

/**
 * Creates a user-friendly error message from various error types
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (isFirebaseAuthError(error)) {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/email-already-in-use':
        return 'This email is already registered.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      default:
        return `Authentication error: ${error.message}`;
    }
  }
  
  if (isFirebaseSDKError(error)) {
    if (error.code === 'storage/object-not-found') {
      return 'File not found.';
    }
    if (error.code === 'storage/unauthorized') {
      return 'You do not have permission to access this file.';
    }
    if (error.code === 'storage/quota-exceeded') {
      return 'Storage quota exceeded.';
    }
    return `Firebase error: ${error.message}`;
  }
  
  if (isValidationError(error)) {
    return error.message;
  }
  
  if (isEnvError(error)) {
    return `Configuration error: ${error.message}`;
  }

  if (isNetworkError(error)) {
    if (error.statusCode === 404) {
      return 'The requested resource was not found.';
    }
    if (error.statusCode === 403 || error.statusCode === 401) {
      return 'You do not have permission to access this resource.';
    }
    if (error.statusCode && error.statusCode >= 500) {
      return 'Server error. Please try again later.';
    }
    return `Network error: ${error.message}`;
  }

  if (isPermissionError(error)) {
    return error.message || 'You do not have permission to perform this action.';
  }

  if (isNotFoundError(error)) {
    return error.message || 'The requested resource was not found.';
  }
  
  return getErrorMessage(error);
}

/**
 * Gets HTTP status code from error
 */
export function getErrorStatusCode(error: unknown): number {
  if (isNetworkError(error) && error.statusCode) {
    return error.statusCode;
  }
  
  if (isFirebaseAuthError(error)) {
    if (error.code === 'auth/network-request-failed') {
      return 503; // Service Unavailable
    }
    return 401; // Unauthorized
  }

  if (isFirebaseSDKError(error)) {
    if (error.code === 'storage/unauthorized' || error.code === 'firestore/permission-denied') {
      return 403; // Forbidden
    }
    if (error.code === 'storage/object-not-found' || error.code === 'firestore/not-found') {
      return 404; // Not Found
    }
    if (error.code === 'storage/quota-exceeded') {
      return 507; // Insufficient Storage
    }
    return 500; // Internal Server Error
  }

  if (isPermissionError(error)) {
    return 403; // Forbidden
  }

  if (isNotFoundError(error)) {
    return 404; // Not Found
  }

  if (isValidationError(error)) {
    return 400; // Bad Request
  }

  if (isEnvError(error)) {
    return 500; // Internal Server Error
  }

  return 500; // Default to Internal Server Error
}

/**
 * Checks if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isNetworkError(error)) {
    // Retry on network errors and 5xx status codes
    return !error.statusCode || error.statusCode >= 500 || error.statusCode === 408;
  }

  if (isFirebaseAuthError(error)) {
    // Retry on network-related auth errors
    return error.code === 'auth/network-request-failed';
  }

  if (isFirebaseSDKError(error)) {
    // Retry on network-related Firebase errors
    return error.code.includes('network') || error.code.includes('unavailable');
  }

  // Don't retry validation, permission, or not found errors
  if (isValidationError(error) || isPermissionError(error) || isNotFoundError(error)) {
    return false;
  }

  // Default: don't retry unknown errors
  return false;
}

/**
 * Extracts error context for logging
 */
export function getErrorContext(error: unknown): Record<string, unknown> {
  const context: Record<string, unknown> = {
    errorType: 'unknown',
    message: getErrorMessage(error),
    code: getErrorCode(error),
  };

  if (isError(error)) {
    context.errorType = error.name || 'Error';
    if (error.stack) {
      context.stack = error.stack;
    }
  }

  if (isValidationError(error)) {
    context.field = error.field;
    context.value = error.value;
  }

  if (isEnvError(error)) {
    context.variable = error.variable;
  }

  if (isNetworkError(error)) {
    context.statusCode = error.statusCode;
    context.url = error.url;
  }

  if (isPermissionError(error)) {
    context.resource = error.resource;
    context.action = error.action;
  }

  if (isNotFoundError(error)) {
    context.resource = error.resource;
    context.id = error.id;
  }

  if (isFirebaseAuthError(error)) {
    context.firebaseCode = error.code;
  }

  if (isFirebaseSDKError(error)) {
    context.firebaseCode = error.code;
  }

  return context;
}


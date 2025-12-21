/**
 * Environment variable validation and type definitions
 * 
 * This module provides type-safe access to environment variables
 * with runtime validation to catch configuration errors early.
 */

/**
 * Type definition for Firebase service account JSON
 */
export interface FirebaseServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

/**
 * Validated environment variables interface
 */
export interface Env {
  // AI/Genkit
  GEMINI_API_KEY: string;
  
  // PayPal (server-side only)
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  
  // Firebase Admin (optional, server-side only)
  FIREBASE_SERVICE_ACCOUNT: FirebaseServiceAccount | null;
  
  // EmailJS (client-side)
  NEXT_PUBLIC_EMAILJS_SERVICE_ID: string | undefined;
  NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: string | undefined;
  NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: string | undefined;
  
  // Node environment
  NODE_ENV: 'development' | 'production' | 'test';
}

/**
 * Validates and parses Firebase service account from JSON string
 */
function parseFirebaseServiceAccount(value: string | undefined): FirebaseServiceAccount | null {
  if (!value) {
    return null;
  }
  
  try {
    const parsed = JSON.parse(value);
    // Basic validation - check for required fields
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.project_id === 'string' &&
      typeof parsed.private_key === 'string' &&
      typeof parsed.client_email === 'string'
    ) {
      return parsed as FirebaseServiceAccount;
    }
    throw new Error('Invalid Firebase service account structure');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT: ${message}`);
  }
}

/**
 * Gets a required environment variable or throws an error
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Gets an optional environment variable
 */
function getOptionalEnv(key: string): string | undefined {
  return process.env[key];
}

/**
 * Validates and returns typed environment variables
 * 
 * @throws Error if required environment variables are missing
 */
export function getEnv(): Env {
  return {
    GEMINI_API_KEY: getRequiredEnv('GEMINI_API_KEY'),
    PAYPAL_CLIENT_ID: getRequiredEnv('PAYPAL_CLIENT_ID'),
    PAYPAL_CLIENT_SECRET: getRequiredEnv('PAYPAL_CLIENT_SECRET'),
    FIREBASE_SERVICE_ACCOUNT: parseFirebaseServiceAccount(
      getOptionalEnv('FIREBASE_SERVICE_ACCOUNT')
    ),
    NEXT_PUBLIC_EMAILJS_SERVICE_ID: getOptionalEnv('NEXT_PUBLIC_EMAILJS_SERVICE_ID'),
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: getOptionalEnv('NEXT_PUBLIC_EMAILJS_TEMPLATE_ID'),
    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: getOptionalEnv('NEXT_PUBLIC_EMAILJS_PUBLIC_KEY'),
    NODE_ENV: (getOptionalEnv('NODE_ENV') || 'development') as Env['NODE_ENV'],
  };
}

/**
 * Gets environment variables with validation, but allows optional variables
 * Use this for server-side code where some variables may be optional
 */
export function getEnvSafe(): Partial<Env> & { NODE_ENV: Env['NODE_ENV'] } {
  const nodeEnv = (getOptionalEnv('NODE_ENV') || 'development') as Env['NODE_ENV'];
  
  return {
    GEMINI_API_KEY: getOptionalEnv('GEMINI_API_KEY'),
    PAYPAL_CLIENT_ID: getOptionalEnv('PAYPAL_CLIENT_ID'),
    PAYPAL_CLIENT_SECRET: getOptionalEnv('PAYPAL_CLIENT_SECRET'),
    FIREBASE_SERVICE_ACCOUNT: parseFirebaseServiceAccount(
      getOptionalEnv('FIREBASE_SERVICE_ACCOUNT')
    ),
    NEXT_PUBLIC_EMAILJS_SERVICE_ID: getOptionalEnv('NEXT_PUBLIC_EMAILJS_SERVICE_ID'),
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: getOptionalEnv('NEXT_PUBLIC_EMAILJS_TEMPLATE_ID'),
    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: getOptionalEnv('NEXT_PUBLIC_EMAILJS_PUBLIC_KEY'),
    NODE_ENV: nodeEnv,
  };
}

/**
 * Validates EmailJS environment variables (client-side)
 * Returns true if all required variables are present
 */
export function hasEmailJSConfig(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID &&
    process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID &&
    process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
  );
}

/**
 * Gets EmailJS configuration (client-side safe)
 */
export function getEmailJSConfig(): {
  serviceId: string;
  templateId: string;
  publicKey: string;
} | null {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  
  if (serviceId && templateId && publicKey) {
    return { serviceId, templateId, publicKey };
  }
  
  return null;
}



// IMPORTANT: This file contains server-side logic that uses secrets.
// Ensure you have set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in your environment variables.

import {
    Client,
    Environment,
    LogLevel,
} from '@paypal/paypal-server-sdk';
import { getGeneralSettings } from './firebase-settings-service';

let clientInstance: Client | null = null;
const PAYPAL_CLIENT_ID = "AZTt9MVK63m_kcmv3r43nZKDotUbgcrz8y4g3dnAJn5FhPsQ9bV5sbYcUfWaELDF1Ij7jYjPaZLhpO-o";

// This function now fetches credentials from Firebase instead of process.env
// It should only be called in a server-side context (e.g., API routes)
export function getPayPalClient(): Client {
    // In a serverless environment, we might want to re-evaluate the client instance
    // on each call, but for simplicity, we'll cache it for the lifetime of the server instance.
    if (clientInstance) {
        // NOTE: This assumes credentials do not change during the server's lifetime.
        // If you allow dynamic credential updates that need to be reflected immediately,
        // you may need to remove this caching or add a mechanism to invalidate it.
        // For now, this is a reasonable performance optimization.
        return clientInstance;
    }

    const {
        PAYPAL_CLIENT_SECRET,
    } = process.env;

     if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        console.error('PayPal API credentials are not configured in environment variables.');
        throw new Error('PayPal API credentials are not configured in environment variables.');
    }
    
    const environment = process.env.NODE_ENV === 'production' 
        ? Environment.Production 
        : Environment.Sandbox;

    console.log(`[PayPalClient] Initializing PayPal client for ${process.env.NODE_ENV} environment.`);

    clientInstance = new Client({
        clientCredentialsAuthCredentials: {
            oAuthClientId: PAYPAL_CLIENT_ID,
            oAuthClientSecret: PAYPAL_CLIENT_SECRET,
        },
        timeout: 0,
        environment: environment,
        logging: {
            logLevel: LogLevel.Info,
            logRequest: { logBody: true },
            logResponse: { logHeaders: true },
        },
    });

    return clientInstance;
}

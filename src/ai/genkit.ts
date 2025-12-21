import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { getEnvSafe } from '@/lib/env';

// Validate environment variables at module load time
const env = getEnvSafe();

if (!env.GEMINI_API_KEY) {
  throw new Error(
    'GEMINI_API_KEY environment variable is required. ' +
    'Please set it in your .env file or environment variables.'
  );
}

export const ai = genkit({
  plugins: [googleAI({apiKey: env.GEMINI_API_KEY})],
  model: 'googleai/gemini-2.0-flash',
});

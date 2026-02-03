// The Next.js server, which runs this in development, automatically loads .env files.
// Explicitly calling config() from dotenv can sometimes cause conflicts or unexpected behavior.
// We will rely on the Next.js environment to provide the API key.

import '@/ai/flows/extract-text-from-image.ts';
import '@/ai/flows/structure-pdf-data-flow.ts';

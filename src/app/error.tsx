"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { getErrorMessage, getUserFriendlyErrorMessage, getErrorContext } from '@/types/errors';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      const context = getErrorContext(error);
      console.error('[Error Boundary]', {
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        ...context,
      });
    }
  }, [error]);

  const userMessage = getUserFriendlyErrorMessage(error);
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-2xl">Something went wrong</CardTitle>
          </div>
          <CardDescription>
            {userMessage || 'An unexpected error occurred. Please try again.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && error.message && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-mono text-muted-foreground break-all">
                {error.message}
              </p>
            </div>
          )}
          {isDevelopment && error.digest && (
            <div className="text-xs text-muted-foreground">
              Error ID: {error.digest}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            If this problem persists, please contact support or try refreshing the page.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button onClick={reset} variant="default" className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}


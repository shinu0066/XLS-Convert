
"use client";

import { AuthForm, type AuthFormSubmitValues } from "@/components/auth/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth, type SignUpData } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import LoadingSpinner from "@/components/core/loading-spinner";
import type { GeneralSiteSettings } from '@/types/site-settings';
import { subscribeToGeneralSettings } from '@/lib/firebase-settings-service';

const GENERIC_APP_NAME_FALLBACK = "Our Service";

// Simple Google Icon SVG
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);

export default function SignupPage() {
  const { signUp, signInWithGoogle, currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false); 
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [displayedSiteTitle, setDisplayedSiteTitle] = useState<string>(GENERIC_APP_NAME_FALLBACK);

  useEffect(() => {
    const unsubscribe = subscribeToGeneralSettings((settings) => {
      setDisplayedSiteTitle(settings?.siteTitle || GENERIC_APP_NAME_FALLBACK);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authLoading && currentUser) {
      router.push("/");
    }
  }, [currentUser, authLoading, router]);

  const handleSignup = async (formValues: AuthFormSubmitValues) => {
    setIsLoading(true);
    const signupData: SignUpData = {
      email: formValues.email,
      password: formValues.password,
      firstName: formValues.firstName!, 
      lastName: formValues.lastName!,   
    };
    try {
      await signUp(signupData);
      toast({ title: "Signup Successful", description: `Welcome to ${displayedSiteTitle}!` });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      console.error("Signup page error (Email/Pass):", error);
      toast({ variant: "destructive", title: "Signup Failed", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        toast({ title: "Google Sign-Up Successful", description: `Welcome to ${displayedSiteTitle}!` });
      }
    } catch (error: unknown) {
      console.error("Signup page error (Google):", error);
      // Check if the error is the specific "popup closed by user" to avoid toasting for that
      const errorCode = 
        error &&
        typeof error === 'object' &&
        'code' in error &&
        typeof error.code === 'string'
          ? error.code
          : undefined;
      
      if (errorCode !== 'auth/popup-closed-by-user') {
        const errorMessage = error instanceof Error ? error.message : "Could not sign up with Google.";
        toast({ variant: "destructive", title: "Google Sign-Up Failed", description: errorMessage });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (authLoading || (!authLoading && currentUser)) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Create Account</CardTitle>
          <CardDescription>Sign up to start converting your PDFs to Excel with {displayedSiteTitle}.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm 
            mode="signup"
            onSubmit={handleSignup} 
            submitButtonText="Sign Up" 
            isLoading={isLoading}
          />
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or sign up with
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2.5 py-2.5 text-sm font-medium transition-all duration-200 ease-out hover:shadow-lg active:scale-[0.97] hover:bg-accent/10 border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={handleGoogleSignUp}
            disabled={isLoading || isGoogleLoading || authLoading}
          >
            {isGoogleLoading ? (
              <LoadingSpinner message="Processing..." />
            ) : (
              <>
                <GoogleIcon /> Sign up with Google
              </>
            )}
          </Button>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import { AdminAuthForm, type AuthFormValues } from "@/components/admin/admin-auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link"; 
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import LoadingSpinner from "@/components/core/loading-spinner";
import type { GeneralSiteSettings } from '@/types/site-settings';
import { subscribeToGeneralSettings } from '@/lib/firebase-settings-service';

const GENERIC_APP_NAME_FALLBACK = "Admin Panel"; // Fallback for admin pages

export default function AdminLoginPage() {
  const { adminSignIn, adminUser, loading: authLoading } = useAdminAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayedSiteTitle, setDisplayedSiteTitle] = useState<string>(GENERIC_APP_NAME_FALLBACK);

  useEffect(() => {
    const unsubscribe = subscribeToGeneralSettings((settings) => {
        // Use a specific admin panel title, or the site title, or a generic fallback
        setDisplayedSiteTitle(settings?.siteTitle ? `${settings.siteTitle} Admin` : GENERIC_APP_NAME_FALLBACK);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authLoading && adminUser) {
      router.replace("/admin/dashboard");
    }
  }, [adminUser, authLoading, router]);

  const handleLogin = async (values: AuthFormValues) => {
    setIsSubmitting(true);
    try {
      await adminSignIn(values);
      toast({ title: "Admin Login Successful", description: "Redirecting to dashboard..." });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Admin Login page caught specific error:", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
 
  if (authLoading && !adminUser) { 
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner message="Loading Admin Session..." />
      </div>
    );
  }
  
  if (!authLoading && adminUser) { 
     return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner message="Redirecting to Dashboard..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Admin Panel Login</CardTitle>
          <CardDescription>Access the {displayedSiteTitle} administration area.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminAuthForm 
            mode="login"
            onSubmit={handleLogin} 
            submitButtonText="Log In" 
            isLoading={isSubmitting || authLoading} 
          />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an admin account?{" "}
            <Link href="/admin/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

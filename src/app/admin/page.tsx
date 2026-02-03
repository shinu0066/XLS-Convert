
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/use-admin-auth'; 
import LoadingSpinner from '@/components/core/loading-spinner';

export default function AdminRootPage() {
  const router = useRouter();
  const { adminUser, loading: authLoading } = useAdminAuth(); 

  useEffect(() => {
    if (authLoading) return; // Wait for auth check to complete

    if (adminUser) { // Validated admin user
      router.replace('/admin/dashboard');
    } else { // No validated admin user, default to login
      router.replace('/admin/login');
    }
  }, [adminUser, authLoading, router]);

  // Show a loading spinner while checks are in progress
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <LoadingSpinner message="Initializing Admin Panel..." />
    </div>
  );
}

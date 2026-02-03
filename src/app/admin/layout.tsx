
"use client";

import { useEffect, useState, type ReactNode } from 'react'; 
import { useRouter, usePathname } from 'next/navigation';
import { AdminAuthProvider, useAdminAuth } from '@/hooks/use-admin-auth';
import AdminHeader from '@/components/admin/layout/admin-header';
import AdminSidebar from '@/components/admin/layout/admin-sidebar';
import LoadingSpinner from '@/components/core/loading-spinner';

function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const { adminUser, loading: authLoading } = useAdminAuth(); 
  const router = useRouter();
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || authLoading) return; 

    const isAuthPage = pathname === '/admin/login' || pathname === '/admin/signup';
    const isAdminRootPage = pathname === '/admin'; // The root /admin page now just redirects

    // If not an admin user and not on an auth page, redirect to login.
    // The /admin page itself will handle its own redirection logic based on auth state.
    if (!adminUser && !isAuthPage && !isAdminRootPage) {
      router.replace('/admin/login');
    }
    
    // If an admin user is logged in and tries to access login/signup, redirect to dashboard.
    if (adminUser && isAuthPage) {
      router.replace('/admin/dashboard');
    }

  }, [adminUser, authLoading, router, pathname, hasMounted]);

  if (!hasMounted) {
    return <div className="flex h-screen items-center justify-center"><LoadingSpinner message="Initializing Admin UI..." /></div>;
  }
  
  // Show loading if auth is resolving and it's not an auth page or the root /admin page (which handles its own spinner)
  if (authLoading && pathname !== '/admin/login' && pathname !== '/admin/signup' && pathname !== '/admin') {
    return <div className="flex h-screen items-center justify-center"><LoadingSpinner message="Loading Admin Data..." /></div>;
  }
  
  // For login, signup, and the root /admin page, render children directly.
  // These pages handle their own layout/redirects.
  if (pathname === '/admin/login' || pathname === '/admin/signup' || pathname === '/admin') {
    return <>{children}</>;
  }
  
  // If not authenticated and not loading, and not on an auth page, redirect (should be caught by useEffect, but as a fallback)
  if (!adminUser && !authLoading) {
     return <div className="flex h-screen items-center justify-center"><LoadingSpinner message="Redirecting to login..." /></div>;
  }

  // If we have a validated adminUser, render the full admin layout.
  if (adminUser) {
    return (
      <div className="flex min-h-screen flex-col">
        <AdminHeader />
        <div className="flex flex-1">
          <AdminSidebar />
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    );
  }

  // Fallback loading if none of the above conditions met (e.g. brief state before redirect)
  return <div className="flex h-screen items-center justify-center"><LoadingSpinner message="Loading..." /></div>;
}

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminProtectedLayout>{children}</AdminProtectedLayout>
    </AdminAuthProvider>
  );
}

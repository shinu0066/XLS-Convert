
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { LogOut, Shield, Home, Menu } from 'lucide-react'; 
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'; // Added Sheet components
import { AdminNavigationLinks } from './admin-sidebar'; // Import AdminNavigationLinks
import { VisuallyHidden } from '@/components/ui/visually-hidden';

export default function AdminHeader() {
  const { adminUser, adminSignOut, loading } = useAdminAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await adminSignOut();
      toast({ title: "Logged Out", description: "Admin successfully logged out." });
      // Router will redirect via layout effect
    } catch (error) {
      toast({ variant: "destructive", title: "Logout Error", description: "Failed to log out." });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
           {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[300px] pt-10 bg-background">
                <VisuallyHidden><SheetTitle>Admin Navigation Menu</SheetTitle></VisuallyHidden>
                <AdminNavigationLinks onLinkClick={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <Shield className="h-7 w-7" />
            <span className="text-lg sm:text-xl font-semibold">Admin Panel</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/" className="flex items-center">
              <Home className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">View Site</span>
            </Link>
          </Button>

          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
          ) : adminUser ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {adminUser.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="px-2 sm:px-3">
                <LogOut className="mr-0 sm:mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}


"use client";

import { memo, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import AppLogo from './app-logo';
import { Languages, Menu, User as UserIcon, LogOut, CreditCard, Settings, FileText } from 'lucide-react'; 
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useSettings } from '@/context/settings-context';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { useLanguage } from '@/context/language-context';
import { languages } from '@/config/translations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const GENERIC_APP_NAME_FALLBACK = "My App";

const AppHeader = memo(function AppHeader() {
  const { currentUser, userProfile, signOut, loading: authLoading } = useAuth();
  const { setLanguage, getTranslation } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { settings, loading: isLoadingSettings } = useSettings();

  const isHomePage = pathname === '/';
  const logoUrl = settings?.logoUrl;
  const siteTitleForLogo = settings?.siteTitle || GENERIC_APP_NAME_FALLBACK;

  const getInitials = useCallback((firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`;
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  }, []);
  
  const navLinks = useMemo(() => [
    ...(!isHomePage ? [{ id: 'home', href: '/', labelKey: 'navHome' }] : []),
    { id: 'documents', href: '/documents', labelKey: 'navDocuments'},
    { id: 'pricing', href: '/pricing', labelKey: 'navPricing' },
  ], [isHomePage]);

  const loggedOutLinks = useMemo(() => [
    ...navLinks,
    { id: 'login', href: '/login', labelKey: 'login' },
    { id: 'register', href: '/signup', labelKey: 'register' },
  ], [navLinks]);

  const loggedInLinks = useMemo(() => [
    ...navLinks,
    { id: 'settings', href: '/settings', labelKey: 'navSettings' },
  ], [navLinks]);

  const mobileLinks = useMemo(() => 
    currentUser ? loggedInLinks : loggedOutLinks,
    [currentUser, loggedInLinks, loggedOutLinks]
  );
  
  const desktopLinks = useMemo(() => 
    currentUser ? loggedInLinks : loggedOutLinks.filter(l => l.id !== 'register'),
    [currentUser, loggedInLinks, loggedOutLinks]
  );


  return (
    <header className="sticky top-0 z-50 border-b bg-card shadow-md">
      <div className="container mx-auto flex h-16 items-center px-4">
        {/* Left Side: Logo */}
        <div className="flex-shrink-0">
         {isLoadingSettings ? 
            <div className="flex items-center gap-2 text-primary">
                <div className="h-7 w-7 bg-muted rounded-full animate-pulse"></div>
                <div className="h-6 w-24 bg-muted rounded animate-pulse"></div>
            </div>
            : <AppLogo logoUrl={logoUrl} siteTitle={siteTitleForLogo} />
        }
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex flex-1 justify-center items-center gap-6 text-sm font-medium">
          {authLoading || isLoadingSettings ? (
            <div className="h-4 w-4/5 animate-pulse rounded-md bg-muted"></div>
          ) : (
            desktopLinks.map((link) => (
                <Link key={link.id} href={link.href!} className="text-muted-foreground hover:text-primary transition-colors">
                  {getTranslation(link.labelKey)}
                </Link>
            ))
          )}
        </nav>

        {/* Right Side: Language, Auth, & Mobile Menu */}
        <div className="flex flex-1 justify-end items-center gap-2">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Languages className="h-5 w-5" />
                <span className="sr-only">Change language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select Language</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {languages.map(lang => (
                <DropdownMenuItem key={lang.code} onSelect={() => setLanguage(lang.code)}>
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {authLoading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={currentUser.photoURL || undefined} alt="User avatar" />
                    <AvatarFallback>{getInitials(userProfile?.firstName, userProfile?.lastName, currentUser.email || '')}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userProfile?.firstName ? `${userProfile.firstName} ${userProfile.lastName}` : 'Welcome'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile"><UserIcon className="mr-2 h-4 w-4" />Profile</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Link href="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/billing"><CreditCard className="mr-2 h-4 w-4" />Billing</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          ) }

          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] pt-10">
                <VisuallyHidden>
                  <SheetTitle>Mobile Navigation Menu</SheetTitle>
                </VisuallyHidden>
                <nav className="flex flex-col gap-4">
                   {authLoading || isLoadingSettings ? (
                     Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="h-6 w-3/4 animate-pulse rounded-md bg-muted mb-2"></div>
                    ))
                  ) : (
                    mobileLinks.map((link) => (
                      <Link 
                        key={link.id} 
                        href={link.href!} 
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {getTranslation(link.labelKey)}
                      </Link>
                    ))
                  )}
                  {currentUser && (
                    <>
                      <div className="border-t pt-4 mt-2"></div>
                      <Link href="/profile" className="text-lg font-medium text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                       <Link href="/settings" className="text-lg font-medium text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Settings</Link>
                      <Link href="/billing" className="text-lg font-medium text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Billing</Link>
                      <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="text-lg font-medium text-destructive hover:text-primary transition-colors text-left">Sign Out</button>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
});

export default AppHeader;

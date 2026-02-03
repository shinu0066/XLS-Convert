
"use client";

import { memo } from 'react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { GeneralSiteSettings } from '@/types/site-settings';
import { subscribeToGeneralSettings } from '@/lib/firebase-settings-service';
import AppLogo from '@/components/layout/app-logo'; // For displaying the site logo
import { Construction } from 'lucide-react'; // Icon for maintenance

const GENERIC_APP_NAME_FALLBACK = "Our Website";

const MaintenanceModeOverlay = memo(function MaintenanceModeOverlay() {
  const [settings, setSettings] = useState<GeneralSiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToGeneralSettings((fetchedSettings) => {
      setSettings(fetchedSettings);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) { // Don't render anything until settings are loaded
    return null;
  }

  const isMaintenanceModeActive = settings?.maintenanceModeEnabled || false;
  const isAdminRoute = pathname.startsWith('/admin');

  if (!isMaintenanceModeActive || isAdminRoute) {
    return null;
  }

  const siteTitle = settings?.siteTitle || GENERIC_APP_NAME_FALLBACK;
  const logoUrl = settings?.logoUrl;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background text-foreground p-8"
      aria-live="polite"
      role="alertdialog"
      aria-labelledby="maintenance-title"
      aria-describedby="maintenance-description"
    >
      <div className="text-center space-y-6 bg-card p-10 rounded-xl shadow-2xl max-w-lg w-full">
        <div className="mb-6">
          <AppLogo logoUrl={logoUrl} siteTitle={siteTitle} />
        </div>
        
        <Construction className="h-16 w-16 text-primary mx-auto animate-pulse" />
        
        <h1 id="maintenance-title" className="text-4xl font-extrabold text-primary">
          Site Under Maintenance
        </h1>
        <p id="maintenance-description" className="text-lg text-muted-foreground">
          We're working hard to improve your experience. The site will be back online shortly.
        </p>
        <p className="text-sm text-muted-foreground">
          Thank you for your patience.
        </p>
      </div>
    </div>
  );
});

export default MaintenanceModeOverlay;

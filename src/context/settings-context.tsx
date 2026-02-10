"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { subscribeToGeneralSettings } from '@/lib/firebase-settings-service';
import type { GeneralSiteSettings } from '@/types/site-settings';

interface SettingsContextType {
  settings: GeneralSiteSettings | null;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * SettingsProvider consolidates all subscribeToGeneralSettings subscriptions
 * into a single shared subscription, reducing Firebase read operations.
 * 
 * Components should use useSettings() hook instead of calling subscribeToGeneralSettings directly.
 */
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<GeneralSiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToGeneralSettings((newSettings) => {
      setSettings(newSettings);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Hook to access general site settings from context.
 * Replaces direct calls to subscribeToGeneralSettings.
 */
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};


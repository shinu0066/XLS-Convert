
"use client";

import { memo } from 'react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { AllPopupSettings, PopupConfig } from '@/types/popup-settings';
import { DEFAULT_POPUP_SETTINGS } from '@/types/popup-settings';
import { subscribeToPopupSettings } from '@/lib/firebase-popup-service';

import BottomPopup from '@/components/popups/BottomPopup';
import TopNavbarPopup from '@/components/popups/TopNavbarPopup';
import CenterScreenPopup from '@/components/popups/CenterScreenPopup';

const DISMISSED_POPUPS_KEY = 'XLSCONVERT_DISMISSED_POPUPS';
// Session dismissal for Center Popup, 1 day for others.
const DISMISS_DURATION_CENTER_MS = 0; // 0 means session only for center
const DISMISS_DURATION_OTHER_MS = 24 * 60 * 60 * 1000; // 1 day

interface DismissedPopupInfo {
  timestamp: number;
  popupId: string;
}

const PopupInjector = memo(function PopupInjector() {
  const [popupSettings, setPopupSettings] = useState<AllPopupSettings>(DEFAULT_POPUP_SETTINGS);
  const [dismissedPopups, setDismissedPopups] = useState<Record<string, DismissedPopupInfo>>({});
  const pathname = usePathname();

  useEffect(() => {
    // Load dismissed popups from localStorage
    if (typeof window !== 'undefined') {
      const storedDismissed = localStorage.getItem(DISMISSED_POPUPS_KEY);
      if (storedDismissed) {
        try {
          const parsed = JSON.parse(storedDismissed) as Record<string, DismissedPopupInfo>;
          // Filter out expired dismissals
          const now = Date.now();
          const validDismissals: Record<string, DismissedPopupInfo> = {};
          Object.keys(parsed).forEach(key => {
            const dismissal = parsed[key];
            const duration = dismissal.popupId === 'centerScreenPopup' ? DISMISS_DURATION_CENTER_MS : DISMISS_DURATION_OTHER_MS;
            if (duration === 0 || (now - dismissal.timestamp < duration) ) { // Session or still valid
                 validDismissals[key] = dismissal;
            }
          });
          setDismissedPopups(validDismissals);
           localStorage.setItem(DISMISSED_POPUPS_KEY, JSON.stringify(validDismissals)); // Save cleaned list
        } catch (e) {
          console.error("Error parsing dismissed popups from localStorage", e);
          localStorage.removeItem(DISMISSED_POPUPS_KEY);
        }
      }
    }

    const unsubscribe = subscribeToPopupSettings((settings) => {
      setPopupSettings(settings);
    });
    return () => unsubscribe();
  }, []);

  const handleDismiss = (popupId: string) => {
    if (typeof window !== 'undefined') {
      const now = Date.now();
      const newDismissedState = { ...dismissedPopups, [popupId]: { timestamp: now, popupId } };
      setDismissedPopups(newDismissedState);
      try {
        localStorage.setItem(DISMISSED_POPUPS_KEY, JSON.stringify(newDismissedState));
      } catch (e) {
        console.error("Error saving dismissed popups to localStorage", e);
      }
    }
  };
  
  const isDismissed = (popupId: string): boolean => {
    const dismissalInfo = dismissedPopups[popupId];
    if (!dismissalInfo) return false;

    const now = Date.now();
    const duration = popupId === 'centerScreenPopup' ? DISMISS_DURATION_CENTER_MS : DISMISS_DURATION_OTHER_MS;
    
    if (duration === 0) { // Session dismissal - for center popup, this means once dismissed in session, it stays dismissed
      // Check if it was dismissed in the current session (timestamp is somewhat recent, not from an old tab)
      // This simple check assumes localStorage is cleared on browser close for session.
      // A more robust session check might involve sessionStorage or more complex logic if strict session is needed across tabs.
      return !!dismissalInfo; 
    }

    return now - dismissalInfo.timestamp < duration;
  };


  // Don't show popups on admin or auth pages
  if (pathname.startsWith('/admin') || pathname === '/login' || pathname === '/signup') {
    return null;
  }

  const { bottomPopup, topNavbarPopup, centerScreenPopup } = popupSettings;

  return (
    <>
      {bottomPopup?.enabled && !isDismissed(bottomPopup.id) && (
        <BottomPopup config={bottomPopup} onDismiss={() => handleDismiss(bottomPopup.id)} />
      )}
      {topNavbarPopup?.enabled && !isDismissed(topNavbarPopup.id) && (
        <TopNavbarPopup config={topNavbarPopup} onDismiss={() => handleDismiss(topNavbarPopup.id)} />
      )}
      {centerScreenPopup?.enabled && !isDismissed(centerScreenPopup.id) && (
        <CenterScreenPopup config={centerScreenPopup} onDismiss={() => handleDismiss(centerScreenPopup.id)} />
      )}
    </>
  );
});

export default PopupInjector;


"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { GeneralSiteSettings } from '@/types/site-settings';
import { subscribeToGeneralSettings } from '@/lib/firebase-settings-service';

const SCRIPT_ID = 'dynamic-ad-loader-script';

export default function AdScriptInjector() {
  const [generalSettings, setGeneralSettings] = useState<GeneralSiteSettings | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = subscribeToGeneralSettings((settings) => {
      setGeneralSettings(settings);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const existingScript = document.getElementById(SCRIPT_ID);
    
    // Do not inject on admin or auth pages
    if (pathname.startsWith('/admin') || pathname === '/login' || pathname === '/signup') {
      if (existingScript) {
        existingScript.remove();
      }
      return;
    }

    const adLoaderScriptContent = generalSettings?.adLoaderScript;

    // Remove old script if it exists, before attempting to add a new one
    // This simplifies logic as we will always append if a valid script is found.
    if (existingScript) {
      existingScript.remove();
    }

    if (adLoaderScriptContent && adLoaderScriptContent.trim() !== "") {
      let scriptElementToInject: HTMLScriptElement | null = null;
      const trimmedContent = adLoaderScriptContent.trim();

      // Attempt to parse the full content string as HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = trimmedContent;
      
      // Prioritize finding the main AdSense loader script
      const allScriptsInPastedCode = tempDiv.getElementsByTagName('script');
      let mainAdsenseLoaderTag: HTMLScriptElement | null = null;

      for (let i = 0; i < allScriptsInPastedCode.length; i++) {
        const s = allScriptsInPastedCode[i];
        if (s.src && s.src.includes('adsbygoogle.js')) {
          mainAdsenseLoaderTag = s;
          break;
        }
      }

      if (mainAdsenseLoaderTag) {
        // Found the primary AdSense loader script
        scriptElementToInject = document.createElement('script');
        scriptElementToInject.id = SCRIPT_ID;
        if (mainAdsenseLoaderTag.src) scriptElementToInject.src = mainAdsenseLoaderTag.src;
        if (mainAdsenseLoaderTag.async) scriptElementToInject.async = true; // HTML standard is boolean
        if (mainAdsenseLoaderTag.defer) scriptElementToInject.defer = true; // HTML standard is boolean
        if (mainAdsenseLoaderTag.crossOrigin) scriptElementToInject.crossOrigin = mainAdsenseLoaderTag.crossOrigin;
        if (mainAdsenseLoaderTag.type) scriptElementToInject.type = mainAdsenseLoaderTag.type;
        // Inline content for src scripts is usually not meaningful for execution itself.
      } else if (trimmedContent.toLowerCase().startsWith('<script') && !trimmedContent.includes('<ins') && tempDiv.childNodes.length === 1 && tempDiv.firstChild?.nodeName === 'SCRIPT') {
        // Fallback: If it's a single script tag (and not complex HTML with <ins> etc.)
        // This might be a different type of ad script or a custom script.
        const singleScriptTag = tempDiv.firstChild as HTMLScriptElement;
        scriptElementToInject = document.createElement('script');
        scriptElementToInject.id = SCRIPT_ID;
        if (singleScriptTag.src) scriptElementToInject.src = singleScriptTag.src;
        if (singleScriptTag.async) scriptElementToInject.async = true;
        if (singleScriptTag.defer) scriptElementToInject.defer = true;
        if (singleScriptTag.crossOrigin) scriptElementToInject.crossOrigin = singleScriptTag.crossOrigin;
        if (singleScriptTag.type) scriptElementToInject.type = singleScriptTag.type;
        
        // Only set textContent if it's an inline script (no src)
        if (!singleScriptTag.src && singleScriptTag.textContent) {
          scriptElementToInject.textContent = singleScriptTag.textContent;
        }
      } else if (!trimmedContent.includes('<') && !trimmedContent.includes('>')) {
        // Fallback: Assumed to be plain JavaScript code (no HTML tags at all)
        scriptElementToInject = document.createElement('script');
        scriptElementToInject.id = SCRIPT_ID;
        scriptElementToInject.textContent = trimmedContent;
      }

      if (scriptElementToInject) {
        document.head.appendChild(scriptElementToInject);
      } else {
        console.warn("AdScriptInjector: The Ad Loader Script content was not a recognized AdSense loader, a single valid script tag, or plain JavaScript. No script injected. Content was:", adLoaderScriptContent);
      }

    }
    // If adLoaderScriptContent is empty or null, the existingScript (if any) was already removed.

    // Cleanup function (optional, but good practice if scripts had specific removal needs)
    return () => {
      // The script is managed by ID, so re-runs of useEffect handle its presence/absence.
      // If scripts were added without IDs or needed special teardown, it would go here.
      // For instance, if path changes to admin, the main effect will remove it.
    };
  }, [generalSettings, pathname]);

  return null; 
}

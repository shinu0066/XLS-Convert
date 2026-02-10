
"use client";

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import type { GeneralSiteSettings, CustomScript } from '@/types/site-settings';
import { subscribeToGeneralSettings } from '@/lib/firebase-settings-service';

const SCRIPT_TAG_PREFIX = 'custom-header-script-';

export default function CustomScriptInjector() {
  const [generalSettings, setGeneralSettings] = useState<GeneralSiteSettings | null>(null);
  const pathname = usePathname();
  const injectedScriptIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = subscribeToGeneralSettings((settings) => {
      setGeneralSettings(settings);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Function to remove all scripts managed by this component
    const cleanupScripts = () => {
      injectedScriptIds.current.forEach(id => {
        const scriptElement = document.getElementById(id);
        if (scriptElement) {
          scriptElement.remove();
        }
      });
      injectedScriptIds.current.clear();
    };

    // Do not inject on admin or auth pages, and clean up any existing scripts
    if (pathname.startsWith('/admin') || pathname === '/login' || pathname === '/signup') {
      cleanupScripts();
      return;
    }

    const scriptsToInject = generalSettings?.customScripts || [];
    
    // Cleanup existing scripts before re-injecting to handle updates and removals correctly
    cleanupScripts();

    scriptsToInject.forEach((scriptConfig, index) => {
      if (!scriptConfig.enabled || !scriptConfig.scriptContent || scriptConfig.scriptContent.trim() === "") {
        return; // Skip disabled or empty scripts
      }

      // Create a temporary container to parse the script content string
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = scriptConfig.scriptContent;

      const scriptNodes = tempDiv.querySelectorAll('script');

      if (scriptNodes.length > 0) {
        scriptNodes.forEach((node, nodeIndex) => {
          const newScript = document.createElement('script');
          const scriptId = `${SCRIPT_TAG_PREFIX}${scriptConfig.id}-${nodeIndex}`;
          newScript.id = scriptId;

          // Copy attributes (src, async, defer, etc.)
          for (const attr of node.attributes) {
            newScript.setAttribute(attr.name, attr.value);
          }

          // Copy inline content
          if (node.innerHTML) {
            newScript.innerHTML = node.innerHTML;
          }
          
          document.head.appendChild(newScript);
          injectedScriptIds.current.add(scriptId);
        });
      } else if (!scriptConfig.scriptContent.trim().toLowerCase().startsWith('<')) {
        // Fallback for plain JS code without <script> tags
        const newScript = document.createElement('script');
        const scriptId = `${SCRIPT_TAG_PREFIX}${scriptConfig.id}-0`;
        newScript.id = scriptId;
        newScript.innerHTML = scriptConfig.scriptContent;
        document.head.appendChild(newScript);
        injectedScriptIds.current.add(scriptId);
      } else {
        console.warn(`Custom script named "${scriptConfig.name}" did not contain a valid <script> tag.`);
      }
    });

    return cleanupScripts; // Ensure cleanup on component unmount
  }, [generalSettings, pathname]);

  return null;
}

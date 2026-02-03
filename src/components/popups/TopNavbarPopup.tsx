
"use client";

import { useState, useEffect } from 'react';
import type { PopupConfig } from '@/types/popup-settings';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopNavbarPopupProps {
  config: PopupConfig;
  onDismiss: () => void;
}

export default function TopNavbarPopup({ config, onDismiss }: TopNavbarPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (config.enabled) {
      // Small delay for effect
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [config.enabled]);

  if (!isVisible || !config.enabled) {
    return null;
  }

  // NOTE: This popup assumes it's displayed below a sticky header.
  // The `top-16` class is a common offset for a header of `h-16`. Adjust if your header height differs.
  return (
    <div
      className={cn(
        "fixed top-16 left-0 right-0 z-[900] transition-all duration-500 ease-out", // Lower z-index than main header potentially
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}
      role="alert"
      aria-labelledby={`top-navbar-popup-message-${config.id}`}
    >
      <div className="bg-primary text-primary-foreground p-3 shadow-lg">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <p id={`top-navbar-popup-message-${config.id}`} className="text-sm font-medium text-center flex-grow">
            {config.message}
          </p>
          <div className="flex items-center gap-3 shrink-0">
            {config.ctaText && config.ctaLink && (
              <Button
                variant="secondary" // Or a custom variant that fits the primary background
                size="sm"
                onClick={() => {
                  if (config.ctaLink) window.open(config.ctaLink, '_blank');
                  onDismiss(); // Dismiss after CTA click
                }}
                className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
              >
                {config.ctaText}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Close announcement" className="hover:bg-primary-foreground/10">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

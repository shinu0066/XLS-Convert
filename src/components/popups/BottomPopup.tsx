
"use client";

import { useState, useEffect } from 'react';
import type { PopupConfig } from '@/types/popup-settings';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomPopupProps {
  config: PopupConfig;
  onDismiss: () => void;
}

export default function BottomPopup({ config, onDismiss }: BottomPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (config.enabled) {
      // Small delay to ensure it's noticeable
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [config.enabled]);

  if (!isVisible || !config.enabled) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[1000] p-4 transition-all duration-500 ease-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      )}
      role="alertdialog"
      aria-labelledby={`bottom-popup-message-${config.id}`}
      aria-describedby={config.ctaText ? `bottom-popup-cta-${config.id}` : undefined}
    >
      <div className="container mx-auto max-w-3xl">
        <div className="bg-card text-card-foreground p-4 rounded-lg shadow-2xl flex items-center justify-between gap-4">
          <p id={`bottom-popup-message-${config.id}`} className="text-sm md:text-base">
            {config.message}
          </p>
          <div className="flex items-center gap-3 shrink-0">
            {config.ctaText && config.ctaLink && (
              <Button
                id={`bottom-popup-cta-${config.id}`}
                size="sm"
                onClick={() => {
                  if (config.ctaLink) window.open(config.ctaLink, '_blank');
                  onDismiss(); // Dismiss after CTA click
                }}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {config.ctaText}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Close popup">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

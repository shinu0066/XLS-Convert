
"use client";

import { useState, useEffect } from 'react';
import type { PopupConfig } from '@/types/popup-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'; // Using Dialog for modality
import { X } from 'lucide-react';

interface CenterScreenPopupProps {
  config: PopupConfig;
  onDismiss: () => void;
}

export default function CenterScreenPopup({ config, onDismiss }: CenterScreenPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (config.enabled) {
      const delay = (config.delaySeconds || 0) * 1000;
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, Math.max(0, delay)); // Ensure delay is not negative
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [config.enabled, config.delaySeconds]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onDismiss(); // Call dismiss when dialog is closed by any means
    }
    setIsOpen(open);
  };
  
  if (!config.enabled) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={onDismiss} // Ensure ESC key also calls onDismiss
        onPointerDownOutside={onDismiss} // Ensure clicking outside calls onDismiss
      >
        <DialogHeader>
          {config.title && <DialogTitle>{config.title}</DialogTitle>}
          <DialogDescription className="sr-only">Promotional Popup</DialogDescription> {/* For accessibility if title is missing */}
        </DialogHeader>
        
        <div className="py-4">
          <p>{config.message}</p>
        </div>

        <DialogFooter className="sm:justify-start">
          {config.ctaText && config.ctaLink && (
            <Button
              type="button"
              onClick={() => {
                if (config.ctaLink) window.open(config.ctaLink, '_blank');
                handleOpenChange(false); // Close dialog and trigger dismiss
              }}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {config.ctaText}
            </Button>
          )}
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
         {/* Explicit close button inside DialogContent, styled by Dialog default */}
      </DialogContent>
    </Dialog>
  );
}

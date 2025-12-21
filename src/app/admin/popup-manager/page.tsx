
"use client";

import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import type { AllPopupSettings, PopupConfig, PopupType } from '@/types/popup-settings';
import { DEFAULT_POPUP_SETTINGS } from '@/types/popup-settings';
import { getPopupSettings, updatePopupSettings } from '@/lib/firebase-popup-service';
import LoadingSpinner from '@/components/core/loading-spinner';
import { Eye, MessageSquareText, PanelBottom, PanelTop, Tv2 } from 'lucide-react';

type EditablePopupConfig = Omit<PopupConfig, 'id' | 'type' | 'lastUpdated'>;

export default function PopupManagerPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AllPopupSettings>(DEFAULT_POPUP_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentSettings = await getPopupSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error("Error fetching popup settings:", error);
      toast({ variant: 'destructive', title: 'Error Fetching Settings', description: 'Could not load popup settings.' });
      setSettings(DEFAULT_POPUP_SETTINGS); // Fallback to defaults
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleInputChange = (popupType: keyof AllPopupSettings, field: keyof EditablePopupConfig, value: string | boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [popupType]: {
        ...prev[popupType],
        [field]: value,
      }
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updatePopupSettings(settings);
      toast({ title: 'Popup Settings Saved', description: 'Your popup configurations have been updated.' });
    } catch (error) {
      console.error("Error saving popup settings:", error);
      toast({ variant: 'destructive', title: 'Save Error', description: 'Could not save popup settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><LoadingSpinner message="Loading Popup Settings..." /></div>;
  }

  const renderPopupForm = (popupKey: keyof AllPopupSettings, icon: React.ElementType) => {
    const config = settings[popupKey];
    if (!config || typeof config !== 'object' || !('id' in config)) {
      return null;
    }
    const IconComponent = icon;

    return (
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconComponent className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">{config.title || popupKey.replace('Popup', ' Popup')}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`enable-${config.id}`} className="text-sm font-medium">
                {config.enabled ? "Enabled" : "Disabled"}
              </Label>
              <Switch
                id={`enable-${config.id}`}
                checked={config.enabled}
                onCheckedChange={(checked) => handleInputChange(popupKey, 'enabled', checked)}
                disabled={isSaving}
              />
            </div>
          </div>
           <CardDescription>{`Configure the ${popupKey.replace('Popup', '').toLowerCase()} popup.`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.type === 'center-screen' && (
            <div>
              <Label htmlFor={`title-${config.id}`}>Popup Title (Optional)</Label>
              <Input
                id={`title-${config.id}`}
                value={config.title || ''}
                onChange={(e) => handleInputChange(popupKey, 'title', e.target.value)}
                placeholder="e.g., Special Offer!"
                disabled={isSaving || !config.enabled}
              />
            </div>
          )}
          <div>
            <Label htmlFor={`message-${config.id}`}>Message</Label>
            <Textarea
              id={`message-${config.id}`}
              value={config.message}
              onChange={(e) => handleInputChange(popupKey, 'message', e.target.value)}
              placeholder="Enter popup message here..."
              rows={3}
              disabled={isSaving || !config.enabled}
            />
          </div>
          <div>
            <Label htmlFor={`ctaText-${config.id}`}>Button Text (Optional)</Label>
            <Input
              id={`ctaText-${config.id}`}
              value={config.ctaText || ''}
              onChange={(e) => handleInputChange(popupKey, 'ctaText', e.target.value)}
              placeholder="e.g., Learn More"
              disabled={isSaving || !config.enabled}
            />
          </div>
          <div>
            <Label htmlFor={`ctaLink-${config.id}`}>Button Link (Optional)</Label>
            <Input
              id={`ctaLink-${config.id}`}
              type="url"
              value={config.ctaLink || ''}
              onChange={(e) => handleInputChange(popupKey, 'ctaLink', e.target.value)}
              placeholder="e.g., https://example.com/offer"
              disabled={isSaving || !config.enabled}
            />
          </div>
          {config.type === 'center-screen' && (
            <div>
              <Label htmlFor={`delay-${config.id}`}>Display Delay (seconds, for Center Popup)</Label>
              <Input
                id={`delay-${config.id}`}
                type="number"
                value={config.delaySeconds || 0}
                onChange={(e) => handleInputChange(popupKey, 'delaySeconds', parseInt(e.target.value, 10) || 0)}
                min="0"
                disabled={isSaving || !config.enabled}
              />
            </div>
          )}

          <Accordion type="single" collapsible className="w-full pt-4">
            <AccordionItem value="preview" className="border-t">
              <AccordionTrigger className="text-sm hover:no-underline">
                <Eye className="mr-2 h-4 w-4" /> Show Basic Preview (Admin only)
              </AccordionTrigger>
              <AccordionContent>
                <div className="mt-2 p-4 border rounded-md bg-muted/30 min-h-[100px] relative overflow-hidden">
                  <p className="text-xs text-muted-foreground mb-2">This is a simplified preview. Actual appearance may vary.</p>
                  {config.type === 'bottom' && (
                    <div className="absolute bottom-2 left-2 right-2 p-3 bg-background border border-border shadow-lg rounded-md">
                      <p className="text-sm">{config.message}</p>
                      {config.ctaText && <Button size="sm" className="mt-2">{config.ctaText}</Button>}
                    </div>
                  )}
                  {config.type === 'top-navbar' && (
                     <div className="absolute top-2 left-2 right-2 p-3 bg-background border border-border shadow-md rounded-md">
                      <p className="text-sm">{config.message}</p>
                      {config.ctaText && <Button size="sm" className="mt-2">{config.ctaText}</Button>}
                    </div>
                  )}
                  {config.type === 'center-screen' && (
                    <div className="p-6 bg-background border border-border shadow-xl rounded-lg max-w-md mx-auto my-4">
                      {config.title && <h3 className="text-lg font-semibold mb-2">{config.title}</h3>}
                      <p className="text-sm mb-4">{config.message}</p>
                      {config.ctaText && <Button>{config.ctaText}</Button>}
                       <Button variant="ghost" size="sm" className="absolute top-2 right-2">X</Button>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <MessageSquareText className="mr-3 h-7 w-7 text-primary" /> Popup Manager
          </CardTitle>
          <CardDescription>
            Configure and manage promotional popups for your website. Changes will apply globally after saving.
            Remember to provide full URLs (e.g., https://example.com) for CTA links.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-6">
        {renderPopupForm('bottomPopup', PanelBottom)}
        {renderPopupForm('topNavbarPopup', PanelTop)}
        {renderPopupForm('centerScreenPopup', Tv2)}
      </div>

      <CardFooter className="flex justify-end mt-8 border-t pt-6">
        <Button type="submit" size="lg" disabled={isSaving || isLoading}>
          {isSaving ? <LoadingSpinner message="Saving Popups..." /> : 'Save All Popup Settings'}
        </Button>
      </CardFooter>
    </form>
  );
}

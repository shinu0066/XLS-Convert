
"use client";

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { GeneralSiteSettings } from '@/types/site-settings'; // Updated type
import { getGeneralSettings, updateGeneralSettings } from '@/lib/firebase-settings-service'; // Updated service
import LoadingSpinner from '@/components/core/loading-spinner';

export default function AdsManagementPage() {
  const { toast } = useToast();
  const [adScript, setAdScript] = useState<string>('');
  const [initialSettings, setInitialSettings] = useState<Partial<GeneralSiteSettings>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentSettings = await getGeneralSettings();
      if (currentSettings) {
        setInitialSettings(currentSettings);
        setAdScript(currentSettings.adLoaderScript || '');
      } else {
        setInitialSettings({});
        setAdScript('');
      }
    } catch (error) {
      console.error("Error fetching ad settings:", error);
      toast({ variant: 'destructive', title: 'Error Fetching Settings', description: 'Could not load ad settings.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAdScript(e.target.value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // We only update the adLoaderScript part of the general settings
      const settingsToUpdate: Partial<GeneralSiteSettings> = {
        ...initialSettings, // Preserve other general settings
        adLoaderScript: adScript || '' 
      };
      await updateGeneralSettings(settingsToUpdate);
      setInitialSettings(settingsToUpdate); // Update initial settings to reflect save
      toast({ title: 'Ad Settings Saved', description: 'Your ad script has been updated successfully.' });
    } catch (error) {
      console.error("Error saving ad settings:", error);
      toast({ variant: 'destructive', title: 'Save Error', description: 'Could not save ad settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><LoadingSpinner message="Loading Ad Settings..." /></div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ads Script Management</CardTitle>
          <CardDescription>
            Manage the primary ad loader script for your website (e.g., Google AdSense Auto Ads script or similar).
            This script will be injected into the &lt;head&gt; of your website pages (excluding admin and auth pages).
            For many ad networks, this single script is enough to display ads across your site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="adLoaderScript">Ad Loader Script</Label>
            <Textarea
              id="adLoaderScript"
              value={adScript}
              onChange={handleScriptChange}
              placeholder="<script async src='https://pagedload2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_CLIENT_ID' crossorigin='anonymous'></script>\n<!-- or other ad network script -->"
              rows={10}
              className="font-mono text-sm"
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              Paste the main script provided by your ad network. This script will be executed on all public-facing pages.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSaving || isLoading}>
            {isSaving ? <LoadingSpinner message="Saving..." /> : 'Save Ad Settings'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

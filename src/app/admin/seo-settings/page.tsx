
"use client";

import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import type { GeneralSiteSettings, PageSEOInfo } from '@/types/site-settings';
import { getGeneralSettings, updateGeneralSettings } from '@/lib/firebase-settings-service';
import LoadingSpinner from '@/components/core/loading-spinner';

interface KnownPage {
  path: string;
  name: string;
  defaultTitle?: string;
  defaultDescription?: string;
}

const KNOWN_APP_PAGES: KnownPage[] = [
  { path: '/', name: 'Home Page', defaultTitle: 'XLSConvert - PDF to Excel Converter', defaultDescription: 'Easily convert your PDF files to structured Excel spreadsheets with AI.' },
  { path: '/documents', name: 'Documents Page', defaultTitle: 'Documentation - XLSConvert', defaultDescription: 'Learn how to use the PDF to Excel converter, its features, and security practices.' },
  { path: '/about', name: 'About Page', defaultTitle: 'About XLSConvert', defaultDescription: 'Learn more about XLSConvert and our mission to simplify data extraction.' },
  { path: '/contact', name: 'Contact Page', defaultTitle: 'Contact XLSConvert', defaultDescription: 'Get in touch with the XLSConvert team for support or inquiries.' },
  { path: '/privacy', name: 'Privacy Policy Page', defaultTitle: 'Privacy Policy - XLSConvert', defaultDescription: 'Read the privacy policy for XLSConvert.' },
  { path: '/pricing', name: 'Pricing Page', defaultTitle: 'Pricing Plans - XLSConvert', defaultDescription: 'Explore pricing plans for XLSConvert PDF to Excel converter.' },
  // Add more pages here as your site grows
];

export default function SeoSettingsPage() {
  const { toast } = useToast();
  const [seoSettings, setSeoSettings] = useState<Record<string, PageSEOInfo>>({});
  const [initialFullSettings, setInitialFullSettings] = useState<Partial<GeneralSiteSettings>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentSettings = await getGeneralSettings();
      if (currentSettings) {
        setInitialFullSettings(currentSettings);
        // Initialize SEO settings for known pages if not already present
        const existingSeo = currentSettings.seoSettings || {};
        const updatedSeoSettings = { ...existingSeo };
        KNOWN_APP_PAGES.forEach(page => {
          if (!updatedSeoSettings[page.path]) {
            updatedSeoSettings[page.path] = { 
              title: page.defaultTitle || '', 
              description: page.defaultDescription || '', 
              keywords: '' 
            };
          }
        });
        setSeoSettings(updatedSeoSettings);
      } else {
        // Initialize if no settings exist at all
        const defaultSeo: Record<string, PageSEOInfo> = {};
        KNOWN_APP_PAGES.forEach(page => {
            defaultSeo[page.path] = { 
              title: page.defaultTitle || '', 
              description: page.defaultDescription || '', 
              keywords: '' 
            };
        });
        setSeoSettings(defaultSeo);
        setInitialFullSettings({ seoSettings: defaultSeo });
      }
    } catch (error) {
      console.error("Error fetching SEO settings:", error);
      toast({ variant: 'destructive', title: 'Error Fetching Settings', description: 'Could not load SEO settings.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleInputChange = (path: string, field: keyof PageSEOInfo, value: string) => {
    setSeoSettings(prev => ({
      ...prev,
      [path]: {
        ...(prev[path] || {}),
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const settingsToUpdate: Partial<GeneralSiteSettings> = {
        ...initialFullSettings, // Preserve other general settings
        seoSettings: seoSettings,
      };
      await updateGeneralSettings(settingsToUpdate);
      setInitialFullSettings(settingsToUpdate); // Update initial settings to reflect save
      toast({ title: 'SEO Settings Saved', description: 'Your website SEO metadata has been updated successfully.' });
    } catch (error) {
      console.error("Error saving SEO settings:", error);
      toast({ variant: 'destructive', title: 'Save Error', description: 'Could not save SEO settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><LoadingSpinner message="Loading SEO Settings..." /></div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>SEO Settings for Pages</CardTitle>
          <CardDescription>
            Manage Meta Titles, Descriptions, and Keywords for specific pages on your website.
            These settings help search engines understand and rank your content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full space-y-4">
            {KNOWN_APP_PAGES.map((page) => {
              const currentPageSeo = seoSettings[page.path] || { title: page.defaultTitle || '', description: page.defaultDescription || '', keywords: '' };
              return (
                <AccordionItem value={page.path} key={page.path} className="border rounded-lg shadow-sm bg-card">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline text-lg font-medium text-primary">
                    {page.name} ({page.path})
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-2 space-y-6 border-t">
                    <div>
                      <Label htmlFor={`title-${page.path}`}>Meta Title</Label>
                      <Input
                        id={`title-${page.path}`}
                        value={currentPageSeo.title || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(page.path, 'title', e.target.value)}
                        placeholder="Enter meta title (e.g., Your Page Name | Site Name)"
                        disabled={isSaving}
                        maxLength={70}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Max 70 characters recommended.</p>
                    </div>
                    <div>
                      <Label htmlFor={`description-${page.path}`}>Meta Description</Label>
                      <Textarea
                        id={`description-${page.path}`}
                        value={currentPageSeo.description || ''}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleInputChange(page.path, 'description', e.target.value)}
                        placeholder="Enter meta description (e.g., A brief summary of your page content.)"
                        rows={3}
                        disabled={isSaving}
                        maxLength={160}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Max 160 characters recommended.</p>
                    </div>
                    <div>
                      <Label htmlFor={`keywords-${page.path}`}>Meta Keywords (comma-separated)</Label>
                      <Input
                        id={`keywords-${page.path}`}
                        value={currentPageSeo.keywords || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(page.path, 'keywords', e.target.value)}
                        placeholder="e.g., keyword1, keyword2, keyword3"
                        disabled={isSaving}
                      />
                       <p className="text-xs text-muted-foreground mt-1">While less impactful now, can still be useful.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button type="submit" size="lg" disabled={isSaving || isLoading}>
            {isSaving ? <LoadingSpinner message="Saving..." /> : 'Save All SEO Settings'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

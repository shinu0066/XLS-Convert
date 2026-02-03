
"use client";

import { useState, useEffect, useCallback, type ChangeEvent, type FormEvent } from 'react';
// Removed Image import as it's no longer used for logo preview here
import Link from 'next/link'; 
import * as LucideIcons from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { GeneralSiteSettings, SocialLink, CustomScript } from '@/types/site-settings';
import { 
  getGeneralSettings, 
  updateGeneralSettings, 
  // uploadSharedSiteLogo, // No longer used from this page
  deleteSharedSiteLogo,
  PREDEFINED_SOCIAL_MEDIA_PLATFORMS
} from '@/lib/firebase-settings-service';
import { PlusCircle, XCircle, FileText, FileCode2, Construction } from 'lucide-react';
// Removed AlertDialog and ImageOff as they were primarily for logo management UI
import LoadingSpinner from '@/components/core/loading-spinner';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_SITE_TITLE = "XLSConvert";
const DEFAULT_ROBOTS_TXT_CONTENT = `User-agent: *
Allow: /
# Sitemap: Replace_this_with_your_full_sitemap_url/sitemap.xml
`;
const DEFAULT_SITEMAP_XML_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>REPLACE_THIS_WITH_YOUR_DOMAIN/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;


export default function GeneralSettingsPage() {
  const { toast } = useToast();

  const [settings, setSettings] = useState<Partial<GeneralSiteSettings>>({
    siteTitle: DEFAULT_SITE_TITLE,
    logoUrl: '', // Kept in state for consistency, but not managed by UI
    socialLinks: PREDEFINED_SOCIAL_MEDIA_PLATFORMS.map(p => ({ ...p, url: '', enabled: false })),
    customScripts: [],
    robotsTxtContent: DEFAULT_ROBOTS_TXT_CONTENT,
    sitemapXmlContent: DEFAULT_SITEMAP_XML_CONTENT,
    maintenanceModeEnabled: false,
  });
  const [initialSettings, setInitialSettings] = useState<Partial<GeneralSiteSettings>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Removed logoFile and logoPreview states

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentSettings = await getGeneralSettings();
      if (currentSettings) {
        const mergedSocialLinks = PREDEFINED_SOCIAL_MEDIA_PLATFORMS.map(p_defined => {
          const savedLink = currentSettings.socialLinks?.find(sl => sl.id === p_defined.id);
          return savedLink ? { ...p_defined, ...savedLink } : { ...p_defined, url: '', enabled: false };
        });

        const newSettings = {
          ...currentSettings,
          socialLinks: mergedSocialLinks,
          customScripts: currentSettings.customScripts || [],
          robotsTxtContent: currentSettings.robotsTxtContent || DEFAULT_ROBOTS_TXT_CONTENT,
          sitemapXmlContent: currentSettings.sitemapXmlContent || DEFAULT_SITEMAP_XML_CONTENT,
          maintenanceModeEnabled: currentSettings.maintenanceModeEnabled || false,
          // logoUrl is part of currentSettings if it exists, will be preserved in initialSettings
        };
        setSettings(newSettings);
        setInitialSettings(newSettings); 
        // No longer setting logoPreview here
      } else {
        const defaultSettingsWithSocial: Partial<GeneralSiteSettings> = { 
          siteTitle: DEFAULT_SITE_TITLE, 
          logoUrl: '', 
          adLoaderScript: '', 
          navItems: [],
          socialLinks: PREDEFINED_SOCIAL_MEDIA_PLATFORMS.map(p => ({ ...p, url: '', enabled: false })),
          customScripts: [],
          robotsTxtContent: DEFAULT_ROBOTS_TXT_CONTENT,
          sitemapXmlContent: DEFAULT_SITEMAP_XML_CONTENT,
          maintenanceModeEnabled: false,
        };
        setSettings(defaultSettingsWithSocial);
        setInitialSettings(defaultSettingsWithSocial);
      }
    } catch (error) {
      console.error("Error fetching general settings:", error);
      toast({ variant: 'destructive', title: 'Error fetching settings', description: 'Could not load general site settings.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSettingChange = (field: keyof GeneralSiteSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // Removed handleLogoChange and handleRemoveLogo (its logic merged into handleSubmit)

  const handleSocialLinkChange = (id: string, field: 'url' | 'enabled', value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      socialLinks: (prev.socialLinks || []).map(link => 
        link.id === id ? { ...link, [field]: value } : link
      ),
    }));
  };

  const handleCustomScriptChange = (id: string, field: keyof CustomScript, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      customScripts: (prev.customScripts || []).map(script =>
        script.id === id ? { ...script, [field]: value } : script
      ),
    }));
  };

  const handleAddCustomScript = () => {
    const newScript: CustomScript = {
      id: uuidv4(),
      name: '',
      scriptContent: '',
      enabled: true,
    };
    setSettings(prev => ({
      ...prev,
      customScripts: [...(prev.customScripts || []), newScript],
    }));
  };

  const handleRemoveCustomScript = (id: string) => {
    setSettings(prev => ({
      ...prev,
      customScripts: (prev.customScripts || []).filter(script => script.id !== id),
    }));
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    
    try {
      // If there was an initial logo URL, attempt to delete it from storage
      // as we are now clearing the logoUrl field.
      if (initialSettings.logoUrl && initialSettings.logoUrl !== '') {
        try {
          await deleteSharedSiteLogo(initialSettings.logoUrl);
          toast({ title: 'Old Site Logo Cleared', description: 'The previous site logo has been removed from storage.' });
        } catch (delError: unknown) {
          const errorCode = 
            delError &&
            typeof delError === 'object' &&
            'code' in delError &&
            typeof delError.code === 'string'
              ? delError.code
              : undefined;
          
          if (errorCode !== 'storage/object-not-found') {
            console.warn("Old logo deletion issue (non-fatal):", delError);
            toast({ variant: 'destructive', title: 'Logo Deletion Issue', description: 'Could not remove the old logo from storage, but settings were saved.' });
          } else {
            console.log("Old logo was not found in storage, nothing to delete for path:", initialSettings.logoUrl);
          }
        }
      }

      const settingsToUpdate: Partial<GeneralSiteSettings> = {
        ...initialSettings, 
        siteTitle: settings.siteTitle || DEFAULT_SITE_TITLE,
        logoUrl: '', // Always clear logoUrl when saving general settings
        socialLinks: settings.socialLinks || [],
        customScripts: settings.customScripts || [],
        adLoaderScript: initialSettings.adLoaderScript, 
        robotsTxtContent: settings.robotsTxtContent || DEFAULT_ROBOTS_TXT_CONTENT,
        sitemapXmlContent: settings.sitemapXmlContent || DEFAULT_SITEMAP_XML_CONTENT,
        maintenanceModeEnabled: settings.maintenanceModeEnabled || false,
      };

      await updateGeneralSettings(settingsToUpdate);
      
      // Update both settings and initialSettings to reflect the cleared logoUrl and other changes
      setSettings(settingsToUpdate); 
      setInitialSettings(settingsToUpdate);
      // No logoFile or logoPreview to manage anymore
      
      toast({ title: 'General Settings Saved', description: 'Site settings have been updated successfully. Logo feature is now managed separately or disabled.' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Could not save settings.';
      console.error("Error during save process:", error);
      toast({ variant: 'destructive', title: 'Save Error', description: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><LoadingSpinner message="Loading General Settings..." /></div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Site Title</CardTitle>
          <CardDescription>Manage the main title for your website. This will be used in the header, footer, and browser tabs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="siteTitleInput">Site Title</Label>
            <Input 
              id="siteTitleInput" 
              value={settings.siteTitle || ''} 
              onChange={(e) => handleSettingChange('siteTitle', e.target.value)} 
              placeholder="e.g., XLSConvert Inc." 
              disabled={isSaving}
            />
          </div>
          {/* Logo management UI removed */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
          <CardDescription>Manage links to your social media profiles. Enabled links will appear in the footer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(settings.socialLinks || []).map(link => {
            const IconComponent = LucideIcons[link.iconName as keyof typeof LucideIcons] as LucideIcons.LucideIcon | undefined || LucideIcons.Link2;
            return (
              <div key={link.id} className="space-y-3 p-4 border rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-6 w-6 text-muted-foreground" />
                    <Label htmlFor={`social-url-${link.id}`} className="text-lg font-medium">{link.name}</Label>
                  </div>
                  <Switch
                    id={`social-enabled-${link.id}`}
                    checked={link.enabled}
                    onCheckedChange={(checked) => handleSocialLinkChange(link.id, 'enabled', checked)}
                    disabled={isSaving}
                  />
                </div>
                {link.enabled && (
                  <div className="pl-8 space-y-1">
                    <Label htmlFor={`social-url-${link.id}`} className="text-xs text-muted-foreground">URL</Label>
                    <Input
                      id={`social-url-${link.id}`}
                      type="url"
                      placeholder={`https://${link.id.toLowerCase()}.com/yourpage`}
                      value={link.url}
                      onChange={(e) => handleSocialLinkChange(link.id, 'url', e.target.value)}
                      disabled={isSaving || !link.enabled}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Header Scripts</CardTitle>
          <CardDescription>
            Add custom scripts (e.g., Google Analytics, tracking pixels) to the &lt;head&gt; of your website.
            Use with caution, as invalid scripts can break your site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(settings.customScripts || []).map((script, index) => (
            <div key={script.id} className="p-4 border rounded-md space-y-4">
              <div className="flex items-center justify-between">
                 <Label htmlFor={`custom-script-name-${script.id}`} className="text-base font-medium">
                  Script #{index + 1}
                </Label>
                <div className='flex items-center gap-2'>
                  <Label htmlFor={`custom-script-enabled-${script.id}`} className="text-sm">Enabled</Label>
                   <Switch
                    id={`custom-script-enabled-${script.id}`}
                    checked={script.enabled}
                    onCheckedChange={(checked) => handleCustomScriptChange(script.id, 'enabled', checked)}
                    disabled={isSaving}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCustomScript(script.id)}
                    disabled={isSaving}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <XCircle className="h-5 w-5" />
                    <span className="sr-only">Remove Script</span>
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor={`custom-script-name-input-${script.id}`}>Script Name (Optional)</Label>
                <Input
                  id={`custom-script-name-input-${script.id}`}
                  placeholder="e.g., Google Analytics"
                  value={script.name}
                  onChange={(e) => handleCustomScriptChange(script.id, 'name', e.target.value)}
                  disabled={isSaving}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`custom-script-content-${script.id}`}>Script Content</Label>
                <Textarea
                  id={`custom-script-content-${script.id}`}
                  placeholder="<script async src='...'></script>"
                  value={script.scriptContent}
                  onChange={(e) => handleCustomScriptChange(script.id, 'scriptContent', e.target.value)}
                  rows={5}
                  className="font-mono text-sm mt-1"
                  disabled={isSaving}
                />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={handleAddCustomScript} disabled={isSaving}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Script
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" />Robots.txt Content</CardTitle>
          <CardDescription>
            Manage the content of your <code className="bg-muted px-1 py-0.5 rounded text-sm">robots.txt</code> file. This file tells search engine crawlers which pages or files the crawler can or can&apos;t request from your site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="robotsTxtContent"
            value={settings.robotsTxtContent || ''}
            onChange={(e) => handleSettingChange('robotsTxtContent', e.target.value)}
            rows={10}
            className="font-mono text-sm"
            placeholder={DEFAULT_ROBOTS_TXT_CONTENT}
            disabled={isSaving}
          />
           <p className="text-xs text-muted-foreground mt-2">
            Changes will be available at <Link href="/robots.txt" target="_blank" className="underline text-primary hover:text-primary/80">/robots.txt</Link> after saving.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><FileCode2 className="mr-2 h-5 w-5 text-primary" />Sitemap (sitemap.xml) Content</CardTitle>
          <CardDescription>
            Manage the content of your <code className="bg-muted px-1 py-0.5 rounded text-sm">sitemap.xml</code> file. This helps search engines better crawl your site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="sitemapXmlContent"
            value={settings.sitemapXmlContent || ''}
            onChange={(e) => handleSettingChange('sitemapXmlContent', e.target.value)}
            rows={15}
            className="font-mono text-sm"
            placeholder={DEFAULT_SITEMAP_XML_CONTENT}
            disabled={isSaving}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Changes will be available at <Link href="/sitemap.xml" target="_blank" className="underline text-primary hover:text-primary/80">/sitemap.xml</Link> after saving.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Construction className="mr-2 h-5 w-5 text-primary" />Website Maintenance Mode</CardTitle>
          <CardDescription>
            Put your website into maintenance mode. Only the admin panel will be accessible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            <Switch
              id="maintenanceMode"
              checked={settings.maintenanceModeEnabled || false}
              onCheckedChange={(checked) => handleSettingChange('maintenanceModeEnabled', checked)}
              disabled={isSaving}
            />
            <Label htmlFor="maintenanceMode" className="text-base">
              Enable Maintenance Mode
            </Label>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            When enabled, all public pages will show a maintenance message. The <code className="bg-muted px-1 py-0.5 rounded text-sm">/admin</code> routes will remain accessible.
          </p>
        </CardContent>
      </Card>

      <CardFooter className="flex justify-end mt-8 border-t pt-6">
        <Button type="submit" size="lg" disabled={isSaving || isLoading}>
          {isSaving ? <LoadingSpinner message="Saving..." /> : 'Save General Settings'}
        </Button>
      </CardFooter>
    </form>
  );
}

    
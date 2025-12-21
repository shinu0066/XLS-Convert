
"use client";

import { memo } from 'react';
import Link from 'next/link';
import AppLogo from './app-logo';
import { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react'; 
import type { GeneralSiteSettings, NavItem, SocialLink } from '@/types/site-settings'; 
import { subscribeToGeneralSettings, PREDEFINED_SOCIAL_MEDIA_PLATFORMS } from '@/lib/firebase-settings-service'; 
import { useLanguage } from '@/context/language-context';

const mainSiteLinks: {id: string; href: string; labelKey: string}[] = [ 
  { id: 'home', href: '/', labelKey: 'navHome' },
  { id: 'documents', href: '/documents', labelKey: 'navDocuments' },
  { id: 'blogs', href: '/blogs', labelKey: 'navBlogs' },
  { id: 'pricing', href: '/pricing', labelKey: 'navPricing' },
  { id: 'about', href: '/about', labelKey: 'navAbout' },
  { id: 'contact', href: '/contact', labelKey: 'navContact' },
  { id: 'privacy', href: '/privacy', labelKey: 'navPrivacy' },
];
const GENERIC_APP_NAME_FALLBACK = "My Application"; // Generic fallback
const DEFAULT_SOCIAL_LINKS: SocialLink[] = PREDEFINED_SOCIAL_MEDIA_PLATFORMS.map(p => ({
  ...p,
  url: '',
  enabled: false,
}));


const AppFooter = memo(function AppFooter() {
  const [logoUrl, setLogoUrl] = useState<string | undefined | null>(undefined);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(DEFAULT_SOCIAL_LINKS);
  const [displayedSiteTitle, setDisplayedSiteTitle] = useState<string>(GENERIC_APP_NAME_FALLBACK);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const { getTranslation } = useLanguage();

  useEffect(() => {
    setIsLoadingSettings(true);
    const unsubscribe = subscribeToGeneralSettings((settings) => {
      if (settings) {
        setLogoUrl(settings.logoUrl);
        setDisplayedSiteTitle(settings.siteTitle || GENERIC_APP_NAME_FALLBACK);
        
        const mergedSocialLinks = PREDEFINED_SOCIAL_MEDIA_PLATFORMS.map(p_defined => {
          const savedLink = settings.socialLinks?.find(sl => sl.id === p_defined.id);
          return savedLink ? { ...p_defined, ...savedLink } : { ...p_defined, url: '', enabled: false };
        });
        setSocialLinks(mergedSocialLinks);
      } else {
        setLogoUrl(undefined);
        setDisplayedSiteTitle(GENERIC_APP_NAME_FALLBACK);
        setSocialLinks(DEFAULT_SOCIAL_LINKS);
      }
      setIsLoadingSettings(false);
    });
    return () => unsubscribe();
  }, []);

  const enabledSocialLinks = socialLinks?.filter(link => link.enabled && link.url) || [];

  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="flex-shrink-0 md:col-span-1 flex justify-center md:justify-start">
            {isLoadingSettings ? 
                <div className="flex items-center gap-2 text-primary">
                    <div className="h-7 w-7 bg-muted rounded-full animate-pulse"></div>
                    <div className="h-6 w-24 bg-muted rounded animate-pulse"></div>
                </div>
                : <AppLogo logoUrl={logoUrl} siteTitle={displayedSiteTitle} />
            }
          </div>
          
          <nav className="flex flex-wrap justify-center md:col-span-1 gap-x-6 gap-y-2 text-sm">
            {isLoadingSettings ? (
              Array.from({length: mainSiteLinks.length}).map((_, i) => <div key={i} className="h-4 w-16 bg-muted rounded animate-pulse"></div>)
            ) : (
              mainSiteLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                  {getTranslation(link.labelKey)}
                </Link>
              ))
            )}
          </nav>

          {!isLoadingSettings && enabledSocialLinks.length > 0 && (
            <div className="flex justify-center md:justify-end items-center gap-4 md:col-span-1">
              {enabledSocialLinks.map((link) => {
                const IconComponent = LucideIcons[link.iconName as keyof typeof LucideIcons] as LucideIcons.LucideIcon | undefined || LucideIcons.Link2;
                return (
                  <Link key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.name}
                        className="text-muted-foreground hover:text-primary transition-colors">
                    <IconComponent className="h-6 w-6" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground border-t border-border pt-8">
          © {new Date().getFullYear()} {displayedSiteTitle}. All rights reserved.
        </div>
      </div>
    </footer>
  );
});

export default AppFooter;

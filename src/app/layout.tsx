
"use client";

import { Geist } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';
import { usePathname } from 'next/navigation';
import { LanguageProvider } from '@/context/language-context';
import { SettingsProvider } from '@/context/settings-context';
import AppInitializer, { DEFAULT_SITE_NAME_FALLBACK } from '@/components/core/app-initializer';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query-client';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

// Schema.org data is now simplified to avoid hydration errors.
// Dynamic properties like `url` are handled by Open Graph tags in AppInitializer.
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: DEFAULT_SITE_NAME_FALLBACK,
};

const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: DEFAULT_SITE_NAME_FALLBACK,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  const mainClassName = isAdminRoute
    ? "flex-grow"
    : "flex-grow container mx-auto px-4 py-8 pt-24 pb-8";

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <title>{DEFAULT_SITE_NAME_FALLBACK}</title>
        {/* Basic meta tags. Title and description will be set by pages or AppInitializer */}
        <meta name="description" content="Easily convert your PDF files to structured Excel spreadsheets with AI." />
        {/* Default Open Graph tags */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={DEFAULT_SITE_NAME_FALLBACK} />
        <meta property="og:image" content="https://placehold.co/1200x630.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Schema.org markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />

      </head>
      <body className={`${geistSans.variable} antialiased font-sans flex flex-col min-h-screen`} suppressHydrationWarning={true}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LanguageProvider>
              <SettingsProvider>
                <AppInitializer>
                  <main className={mainClassName}>
                    {children}
                  </main>
                </AppInitializer>
                <Toaster />
              </SettingsProvider>
            </LanguageProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

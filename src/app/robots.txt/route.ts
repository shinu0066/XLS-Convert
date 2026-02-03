
import { getGeneralSettings } from '@/lib/firebase-settings-service';
import type { NextRequest } from 'next/server';

const DEFAULT_ROBOTS_CONTENT = `User-agent: *
Allow: /
# Default robots.txt - configure in admin panel
`;

export async function GET(request: NextRequest) {
  try {
    const settings = await getGeneralSettings();
    let content = settings?.robotsTxtContent || DEFAULT_ROBOTS_CONTENT;
    
    // Ensure Sitemap URL is correctly placed
    const host = request.headers.get('host') || 'yourdomain.com';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const sitemapUrl = `${protocol}://${host}/sitemap.xml`;

    if (content.includes('Replace_this_with_your_full_sitemap_url')) {
        content = content.replace('Replace_this_with_your_full_sitemap_url', sitemapUrl);
    } else if (!content.toLowerCase().includes('sitemap:')) {
        content = `${content.trim()}\nSitemap: ${sitemapUrl}\n`;
    }

    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', 
      },
    });
  } catch (error) {
    console.error("Error generating robots.txt:", error);
    const host = request.headers.get('host') || 'yourdomain.com';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const sitemapUrl = `${protocol}://${host}/sitemap.xml`;
    const errorContent = `User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`;

    return new Response(errorContent, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

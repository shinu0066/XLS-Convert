
import { getGeneralSettings } from '@/lib/firebase-settings-service';
import type { NextRequest } from 'next/server';

const DEFAULT_SITEMAP_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>REPLACE_THIS_WITH_YOUR_DOMAIN/</loc>
    <lastmod>YYYY-MM-DD</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

export async function GET(request: NextRequest) {
  try {
    const settings = await getGeneralSettings();
    let content = settings?.sitemapXmlContent || DEFAULT_SITEMAP_CONTENT;

    const host = request.headers.get('host') || 'yourdomain.com';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    
    content = content.replace(/REPLACE_THIS_WITH_YOUR_DOMAIN/g, `${protocol}://${host}`);
    content = content.replace(/YYYY-MM-DD/g, new Date().toISOString().split('T')[0]);

    return new Response(content, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error("Error generating sitemap.xml:", error);
    return new Response(DEFAULT_SITEMAP_CONTENT.replace(/YYYY-MM-DD/g, new Date().toISOString().split('T')[0]), {
      status: 500,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}

import type { NextRequest } from "next/server";

const DEFAULT_ROBOTS_CONTENT = `User-agent: *
Allow: /
`;

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") || "yourdomain.com";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const sitemapUrl = `${protocol}://${host}/sitemap.xml`;

  // Always ensure sitemap line exists
  const content = `${DEFAULT_ROBOTS_CONTENT.trim()}\nSitemap: ${sitemapUrl}\n`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}


"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpenText, Loader2 } from 'lucide-react';
import type { BlogPost } from '@/types/blog';
import LoadingSpinner from '@/components/core/loading-spinner';
import { format } from 'date-fns';
import { usePathname } from 'next/navigation';
import { subscribeToGeneralSettings } from '@/lib/firebase-settings-service';
import { postData as moneyPostData } from '@/lib/seed/how-to-earn-money-online';
import { postData as affiliatePostData } from '@/lib/seed/affiliate-marketing-guide';

const GENERIC_PAGE_TITLE = "Our Blog";
const GENERIC_PAGE_DESCRIPTION = "Read the latest articles and updates from our team.";

const seedPosts: BlogPost[] = [
  { ...moneyPostData, id: moneyPostData.slug, createdAt: new Date(), updatedAt: new Date() },
  { ...affiliatePostData, id: affiliatePostData.slug, createdAt: new Date(), updatedAt: new Date() }
];

const updateMeta = (name: string, content: string) => {
    let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);

    const ogName = `og:${name}`;
     let ogTag = document.querySelector(`meta[property="${ogName}"]`) as HTMLMetaElement;
    if (!ogTag) {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', ogName);
        document.head.appendChild(ogTag);
    }
    ogTag.setAttribute('content', content);
};

export default function BlogsPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = subscribeToGeneralSettings((settings) => {
      const siteTitle = settings?.siteTitle || "Our App";
      const seoData = settings?.seoSettings?.[pathname];
      const pageTitle = seoData?.title || `${GENERIC_PAGE_TITLE} - ${siteTitle}`;
      const pageDescription = seoData?.description || GENERIC_PAGE_DESCRIPTION;

      document.title = pageTitle;
      updateMeta('description', pageDescription);
      
      let ogTitleTag = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
      if (!ogTitleTag) {
          ogTitleTag = document.createElement('meta');
          ogTitleTag.setAttribute('property', 'og:title');
          document.head.appendChild(ogTitleTag);
      }
      ogTitleTag.setAttribute('content', pageTitle);

      if (seoData?.keywords) {
        let keywordsTag = document.querySelector('meta[name="keywords"]');
        if (!keywordsTag) {
          keywordsTag = document.createElement('meta');
          keywordsTag.setAttribute('name', 'keywords');
          document.head.appendChild(keywordsTag);
        }
        keywordsTag.setAttribute('content', seoData.keywords);
      }
    });
    return () => unsubscribe();
  }, [pathname]);

  const fetchPosts = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the seed data directly
      setBlogPosts(seedPosts);
    } catch (err: unknown) {
      console.error("Error loading blog posts:", err);
      setError("Failed to load blog posts. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-20rem)] items-center justify-center">
        <LoadingSpinner message="Loading blog posts..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive text-lg">{error}</p>
        <Button onClick={() => fetchPosts()} className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="text-center py-10 bg-card shadow-lg rounded-lg">
        <h1 className="text-5xl font-extrabold text-primary mb-4 flex items-center justify-center">
          <BookOpenText className="mr-3 h-12 w-12" /> Our Blog
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Discover insights, tips, and updates from our team.
        </p>
      </section>

      {blogPosts.length === 0 ? (
        <section className="text-center py-16">
          <BookOpenText className="mx-auto h-24 w-24 text-muted-foreground/50 mb-6" />
          <h2 className="text-3xl font-semibold text-foreground mb-3">No Posts Yet</h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            It looks like we haven&apos;t published any blog posts yet. Check back soon for exciting content!
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Card key={post.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out rounded-lg">
              <CardHeader className="p-0 relative aspect-video">
                <Link href={`/blog/${post.slug}`} aria-label={`Read more about ${post.title}`}>
                  <Image
                    src={post.thumbnailImageUrl || `https://placehold.co/800x400.png`}
                    alt={post.title || 'Blog post thumbnail'}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    data-ai-hint="blog thumbnail"
                  />
                </Link>
              </CardHeader>
              <CardContent className="p-5 flex-grow">
                <CardTitle className="text-xl font-semibold mb-2 leading-tight hover:text-primary transition-colors">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </CardTitle>
                 <p className="text-xs text-muted-foreground mb-3">
                  Published on {format(new Date(post.createdAt as Date), 'MMMM d, yyyy')}
                </p>
                <CardDescription className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {post.shortDescription}
                </CardDescription>
              </CardContent>
              <CardFooter className="p-5 border-t">
                <Button asChild variant="outline" className="w-full group">
                  <Link href={`/blog/${post.slug}`}>
                    Read More <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>
      )}

    </div>
  );
}

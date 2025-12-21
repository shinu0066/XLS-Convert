
"use client";

import { useEffect, useState } from 'react';
import { notFound, usePathname, useParams } from 'next/navigation';
import Image from 'next/image';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from '@/components/core/loading-spinner';
import type { BlogPost } from '@/types/blog';
import { getBlogPostBySlug } from '@/lib/firebase-blog-service';
import { format } from 'date-fns';
import { subscribeToGeneralSettings } from '@/lib/firebase-settings-service';

// Import seed data
import { postData as moneyPostData } from '@/lib/seed/how-to-earn-money-online';
import { postData as affiliatePostData } from '@/lib/seed/affiliate-marketing-guide';

const seedPosts: Record<string, Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'authorId'>> = {
  'how-to-earn-money-online-proven-methods-in-2025': moneyPostData,
  'a-beginners-guide-to-affiliate-marketing-in-2025': affiliatePostData
};

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

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Manually set SEO for the page
    const setSeoData = (blogPost: BlogPost) => {
        document.title = blogPost.title;
        updateMeta('description', blogPost.shortDescription);
        
        let ogTitleTag = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
        if (!ogTitleTag) {
            ogTitleTag = document.createElement('meta');
            ogTitleTag.setAttribute('property', 'og:title');
            document.head.appendChild(ogTitleTag);
        }
        ogTitleTag.setAttribute('content', blogPost.title);

        if (blogPost.thumbnailImageUrl) {
            updateMeta('og:image', blogPost.thumbnailImageUrl);
        }
    };
    
    const fetchPost = () => {
        setIsLoading(true);
        setError(null);
        // Check if the slug matches one of our seed posts
        if (seedPosts[slug]) {
            const seedPost = seedPosts[slug];
            const fullPostData: BlogPost = {
                ...seedPost,
                id: slug, // Use slug as a temporary ID
                createdAt: new Date(), // Use current date for seed data
                updatedAt: new Date(),
                authorId: 'admin-seed'
            };
            setPost(fullPostData);
            setSeoData(fullPostData);
            setIsLoading(false);
        } else {
            // Fallback to fetching from Firebase if you have a database
            // For now, we'll just show an error if it's not a seed post
            setError("Blog post not found.");
            setIsLoading(false);
        }
    };

    if (slug) {
      fetchPost();
    } else {
      setError("Invalid slug provided.");
      setIsLoading(false);
    }

  }, [slug]);
  
  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-20rem)] items-center justify-center">
        <LoadingSpinner message="Loading post..." />
      </div>
    );
  }

  if (error || !post) {
    return notFound();
  }

  return (
    <article className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Button>
      </div>

      <header className="mb-8 space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary leading-tight">
          {post.title}
        </h1>
        <p className="text-lg text-muted-foreground">{post.shortDescription}</p>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(post.createdAt as Date), 'MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>By Admin</span>
          </div>
        </div>
      </header>

      {post.thumbnailImageUrl && (
        <div className="relative aspect-video mb-8 rounded-lg overflow-hidden shadow-lg">
          <Image
            src={post.thumbnailImageUrl}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      <Card>
        <CardContent className="p-6 md:p-8">
            <div
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: post.content }}
            />
        </CardContent>
      </Card>
      
      <Separator className="my-12" />

      <div className="text-center">
         <Button onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    </article>
  );
}

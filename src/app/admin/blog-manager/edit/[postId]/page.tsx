
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBlogPostById } from '@/lib/firebase-blog-service';
import type { BlogPost } from '@/types/blog';
import LoadingSpinner from '@/components/core/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const BlogPostForm = dynamic(() => import('@/components/admin/blog-manager/blog-post-form'), { 
  loading: () => <div className="h-64 flex items-center justify-center"><LoadingSpinner message="Loading Editor..." /></div>,
  ssr: false 
});


export default function EditBlogPostPage() {
  const params = useParams();
  const postId = params.postId as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (postId) {
      const fetchPost = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedPost = await getBlogPostById(postId);
          if (fetchedPost) {
            setPost(fetchedPost);
          } else {
            setError("Blog post not found.");
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Failed to load blog post details.";
          console.error("Error fetching blog post for edit:", err);
          setError(errorMessage);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPost();
    } else {
      setError("No post ID provided.");
      setIsLoading(false);
    }
  }, [postId]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner message="Loading blog post..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!post) {
     return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>The blog post you are trying to edit could not be found.</AlertDescription>
      </Alert>
    );
  }
  

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Blog Post</CardTitle>
          <CardDescription>Modify the details of your blog post below.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-64 flex items-center justify-center"><LoadingSpinner message="Loading Editor..." /></div>}>
            <BlogPostForm existingPost={post} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

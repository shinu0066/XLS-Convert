
"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/core/loading-spinner';

const BlogPostForm = dynamic(() => import('@/components/admin/blog-manager/blog-post-form'), { 
  loading: () => <div className="h-64 flex items-center justify-center"><LoadingSpinner message="Loading Editor..." /></div>,
  ssr: false 
});

export default function NewBlogPostPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Blog Post</CardTitle>
          <CardDescription>Fill in the details below to create a new blog post for your website.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-64 flex items-center justify-center"><LoadingSpinner message="Loading Editor..." /></div>}>
            <BlogPostForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

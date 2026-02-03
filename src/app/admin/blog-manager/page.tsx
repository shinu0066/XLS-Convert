
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Edit, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAllBlogPosts, deleteBlogPost, type PaginatedBlogPosts } from '@/lib/firebase-blog-service';
import type { BlogPost, BlogPostStatus } from '@/types/blog';
import LoadingSpinner from '@/components/core/loading-spinner';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';


const POSTS_PER_PAGE = 10;

export default function BlogManagerPage() {
  const [blogPostsData, setBlogPostsData] = useState<PaginatedBlogPosts>({ posts: [], lastVisibleDoc: null, hasMore: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Stores ID of post being deleted
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const { toast } = useToast();

  const fetchPosts = useCallback(async (lastDoc: QueryDocumentSnapshot<DocumentData> | null = null) => {
    setIsLoading(true);
    try {
      // For the admin page, we always want to fetch from a clean slate.
      // This ensures that if we have seed data, it can be loaded.
      // We will set posts to an empty array to ensure no old data is shown.
      const paginatedResult = { posts: [], lastVisibleDoc: null, hasMore: false };
      
      if (lastDoc) { // If fetching next page
        setBlogPostsData(prev => ({
          posts: [...prev.posts, ...paginatedResult.posts],
          lastVisibleDoc: paginatedResult.lastVisibleDoc,
          hasMore: paginatedResult.hasMore,
        }));
      } else { // Initial fetch or refresh
        setBlogPostsData(paginatedResult);
      }
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      toast({ variant: 'destructive', title: 'Error Fetching Posts', description: 'Could not load blog posts.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDeleteClick = (post: BlogPost) => {
    setPostToDelete(post);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete || !postToDelete.id) return;
    setIsDeleting(postToDelete.id);
    try {
      await deleteBlogPost(postToDelete.id);
      toast({ title: 'Post Deleted', description: `"${postToDelete.title}" has been deleted.` });
      // Refetch or filter out locally
      setBlogPostsData(prev => ({
        ...prev,
        posts: prev.posts.filter(p => p.id !== postToDelete.id)
      }));
    } catch (error) {
      console.error("Error deleting blog post:", error);
      toast({ variant: 'destructive', title: 'Error Deleting Post', description: 'Could not delete the post.' });
    } finally {
      setIsDeleting(null);
      setShowDeleteConfirm(false);
      setPostToDelete(null);
    }
  };

  const handleLoadMore = () => {
    if (blogPostsData.lastVisibleDoc && blogPostsData.hasMore) {
      fetchPosts(blogPostsData.lastVisibleDoc);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Blog Post Management</CardTitle>
            <CardDescription>Create, edit, and manage your blog posts.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/blog-manager/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Post
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && blogPostsData.posts.length === 0 ? (
             <div className="flex h-40 items-center justify-center"><LoadingSpinner message="Loading posts..." /></div>
          ) : blogPostsData.posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No blog posts found. Get started by creating one!</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogPostsData.posts.map((post) => (
                    <TableRow key={post.id} className={isDeleting === post.id ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>
                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'}
                               className={post.status === 'published' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}>
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(post.updatedAt as Date), 'PPp')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/blog-manager/edit/${post.id}`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            {post.status === 'published' && (
                               <DropdownMenuItem asChild>
                                <Link href={`/blog/${post.slug}`} target="_blank">
                                    <ExternalLink className="mr-2 h-4 w-4" /> View Public
                                </Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDeleteClick(post)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {blogPostsData.hasMore && (
          <CardFooter className="justify-center border-t pt-6">
            <Button onClick={handleLoadMore} disabled={isLoading}>
              {isLoading ? <LoadingSpinner message="Loading..." /> : "Load More Posts"}
            </Button>
          </CardFooter>
        )}
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the blog post
              &quot;{postToDelete?.title}&quot; and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={!!isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? <LoadingSpinner message="Deleting..." /> : "Yes, delete post"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

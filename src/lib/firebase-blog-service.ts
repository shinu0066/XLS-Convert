
"use client";

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  Timestamp,
  limit,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { firestore, storage, auth } from './firebase';
import type { BlogPost, BlogPostStatus } from '@/types/blog';
import { PermissionError, NotFoundError, isFirebaseSDKError, getUserFriendlyErrorMessage } from '@/types/errors';
import { logError } from '@/lib/error-handler';

const BLOG_POSTS_COLLECTION = 'blog_posts';
const BLOG_THUMBNAILS_STORAGE_PATH = 'blog_thumbnails';

// Helper to convert Firestore Timestamps to Dates in a BlogPost object
const mapDocToBlogPost = (docSnap: DocumentData): BlogPost => {
  const data = docSnap.data() as BlogPost;
  
  // Helper to safely convert timestamp to Date
  const toDate = (value: unknown): Date => {
    if (value instanceof Timestamp) {
      return value.toDate();
    }
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    // Fallback to current date if value is invalid
    console.warn('Invalid timestamp value, using current date:', value);
    return new Date();
  };
  
  return {
    ...data,
    id: docSnap.id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
};

export async function createBlogPost(postData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'slug'>, newSlug: string): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new PermissionError("Authentication required to create a blog post.", 'blog_posts', 'create');
  }
  try {
    const docRef = await addDoc(collection(firestore, BLOG_POSTS_COLLECTION), {
      ...postData,
      slug: newSlug,
      authorId: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    logError(error, { 
      operation: 'createBlogPost', 
      userId: currentUser.uid,
      slug: newSlug 
    });
    
    if (isFirebaseSDKError(error)) {
      if (error.code === 'firestore/permission-denied') {
        throw new PermissionError("You do not have permission to create blog posts.", 'blog_posts', 'create');
      }
    }
    
    throw error;
  }
}

export async function updateBlogPost(postId: string, postData: Partial<Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'slug'>>, newSlug?: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new PermissionError("Authentication required to update a blog post.", 'blog_posts', 'update');
  }
  try {
    const postRef = doc(firestore, BLOG_POSTS_COLLECTION, postId);
    
    // Check if post exists
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) {
      throw new NotFoundError("Blog post not found.", 'blog_posts', postId);
    }
    
    const updateData = {
      ...postData,
      authorId: currentUser.uid,
      updatedAt: serverTimestamp(),
    } as any;
    if (newSlug) {
      updateData.slug = newSlug;
    }
    await updateDoc(postRef, updateData);
  } catch (error) {
    logError(error, { 
      operation: 'updateBlogPost', 
      userId: currentUser.uid,
      postId 
    });
    
    if (isFirebaseSDKError(error)) {
      if (error.code === 'firestore/permission-denied') {
        throw new PermissionError("You do not have permission to update this blog post.", 'blog_posts', 'update');
      }
      if (error.code === 'firestore/not-found') {
        throw new NotFoundError("Blog post not found.", 'blog_posts', postId);
      }
    }
    
    throw error;
  }
}

export async function deleteBlogPost(postId: string): Promise<void> {
  const currentUser = auth.currentUser;
  try {
    const postRef = doc(firestore, BLOG_POSTS_COLLECTION, postId);
    
    // Check if post exists
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) {
      throw new NotFoundError("Blog post not found.", 'blog_posts', postId);
    }
    
    const postData = postSnap.data() as BlogPost;
    
    // Delete associated thumbnail from storage if it exists
    if (postData.thumbnailImageUrl) {
      try {
        const storageImageRef = ref(storage, postData.thumbnailImageUrl);
        await deleteObject(storageImageRef);
      } catch (storageError: unknown) {
        // Log error but don't let it block post deletion if image not found
        if (isFirebaseSDKError(storageError)) {
          if (storageError.code !== 'storage/object-not-found') {
            logError(storageError, { 
              operation: 'deleteBlogPostThumbnail', 
              userId: currentUser?.uid,
              postId,
              thumbnailUrl: postData.thumbnailImageUrl 
            });
            // Still throw if it's a different error (permission, etc.)
            throw storageError;
          }
        } else {
          logError(storageError, { 
            operation: 'deleteBlogPostThumbnail', 
            userId: currentUser?.uid,
            postId 
          });
          throw storageError;
        }
      }
    }
    
    await deleteDoc(postRef);
  } catch (error) {
    logError(error, { 
      operation: 'deleteBlogPost', 
      userId: currentUser?.uid,
      postId 
    });
    
    if (isFirebaseSDKError(error)) {
      if (error.code === 'firestore/permission-denied') {
        throw new PermissionError("You do not have permission to delete this blog post.", 'blog_posts', 'delete');
      }
      if (error.code === 'firestore/not-found') {
        throw new NotFoundError("Blog post not found.", 'blog_posts', postId);
      }
    }
    
    throw error;
  }
}

export async function getBlogPostById(postId: string): Promise<BlogPost | null> {
  try {
    const postRef = doc(firestore, BLOG_POSTS_COLLECTION, postId);
    const docSnap = await getDoc(postRef);
    if (docSnap.exists()) {
      return mapDocToBlogPost(docSnap);
    }
    return null;
  } catch (error) {
    console.error("Error fetching blog post by ID:", error);
    throw error;
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const q = query(collection(firestore, BLOG_POSTS_COLLECTION), where("slug", "==", slug), where("status", "==", "published"), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return mapDocToBlogPost(querySnapshot.docs[0]);
    }
    return null;
  } catch (error) {
    console.error("Error fetching blog post by slug:", error);
    throw error;
  }
}


export interface PaginatedBlogPosts {
  posts: BlogPost[];
  lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export async function getAllBlogPosts(
  forAdmin: boolean = false,
  postsLimit: number = 10,
  startAfterDoc: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<PaginatedBlogPosts> {
  try {
    let querySnapshot;
    let allFetchedPosts: BlogPost[];

    // For public-facing pages, try server-side filtering with composite index
    // For the admin panel, fetch all posts regardless of status
    if (!forAdmin) {
      try {
        // Attempt server-side filtering with composite index
        // REQUIRED FIREBASE COMPOSITE INDEX:
        // Collection: blog_posts
        // Fields: status (Ascending), createdAt (Descending)
        // Create at: https://console.firebase.google.com/project/_/firestore/indexes
        const baseQuery = startAfterDoc
          ? query(
              collection(firestore, BLOG_POSTS_COLLECTION),
              where('status', '==', 'published'),
              orderBy('createdAt', 'desc'),
              startAfter(startAfterDoc),
              limit(postsLimit)
            )
          : query(
              collection(firestore, BLOG_POSTS_COLLECTION),
              where('status', '==', 'published'),
              orderBy('createdAt', 'desc'),
              limit(postsLimit)
            );
        
        querySnapshot = await getDocs(baseQuery);
        allFetchedPosts = querySnapshot.docs.map(mapDocToBlogPost);
      } catch (indexError: any) {
        // Fallback to client-side filtering if composite index doesn't exist
        console.warn('Blog posts composite index not found. Using client-side filtering. Create index: status (Ascending) + createdAt (Descending)', indexError);
        
        const fallbackQuery = startAfterDoc
          ? query(collection(firestore, BLOG_POSTS_COLLECTION), orderBy('createdAt', 'desc'), startAfter(startAfterDoc), limit(postsLimit))
          : query(collection(firestore, BLOG_POSTS_COLLECTION), orderBy('createdAt', 'desc'), limit(postsLimit));
        
        querySnapshot = await getDocs(fallbackQuery);
        allFetchedPosts = querySnapshot.docs.map(mapDocToBlogPost).filter(post => post.status === 'published');
      }
    } else {
      // Admin panel: fetch all posts
      const q = startAfterDoc
        ? query(collection(firestore, BLOG_POSTS_COLLECTION), orderBy('createdAt', 'desc'), startAfter(startAfterDoc), limit(postsLimit))
        : query(collection(firestore, BLOG_POSTS_COLLECTION), orderBy('createdAt', 'desc'), limit(postsLimit));
      
      querySnapshot = await getDocs(q);
      allFetchedPosts = querySnapshot.docs.map(mapDocToBlogPost);
    }

    const lastVisibleDoc = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;
    
    // Check if there are more documents.
    // Note: This 'hasMore' check might sometimes be true even if the next page has no published posts.
    // The UI will handle this gracefully by just not showing more posts.
    let hasMore = false;
    if (lastVisibleDoc) {
      const nextQuery = query(collection(firestore, BLOG_POSTS_COLLECTION), orderBy('createdAt', 'desc'), startAfter(lastVisibleDoc), limit(1));
      const nextSnapshot = await getDocs(nextQuery);
      hasMore = !nextSnapshot.empty;
    }

    return { posts: allFetchedPosts, lastVisibleDoc, hasMore };
  } catch (error) {
    console.error("Error fetching all blog posts:", error);
    throw error;
  }
}


export async function uploadBlogThumbnail(file: File, postId?: string): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Authentication required to upload a thumbnail.");
  }
  try {
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${postId || 'temp'}_${Date.now()}.${fileExtension}`;
    const storageRefInstance = ref(storage, `${BLOG_THUMBNAILS_STORAGE_PATH}/${uniqueFileName}`);
    
    const snapshot = await uploadBytes(storageRefInstance, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading blog thumbnail:", error);
    throw error;
  }
}

export async function checkSlugExists(slug: string, currentPostId?: string): Promise<boolean> {
  try {
    const q = query(collection(firestore, BLOG_POSTS_COLLECTION), where("slug", "==", slug));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return false; // Slug does not exist
    }
    // If currentPostId is provided, check if the found slug belongs to a different post
    if (currentPostId) {
      return querySnapshot.docs.some(doc => doc.id !== currentPostId);
    }
    return true; // Slug exists and no currentPostId to compare against (e.g., creating new post)
  } catch (error) {
    console.error("Error checking if slug exists:", error);
    throw error; // Or handle as needed, e.g., assume it exists to be safe
  }
}

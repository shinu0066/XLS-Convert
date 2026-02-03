
import type { Timestamp } from 'firebase/firestore';

export type BlogPostStatus = 'draft' | 'published';

export interface BlogPost {
  id?: string; // Firestore document ID
  title: string;
  slug: string; // URL-friendly version of the title
  shortDescription: string; // For card previews
  content: string; // HTML content from Rich Text Editor
  thumbnailImageUrl?: string | null; // URL of the uploaded thumbnail
  status: BlogPostStatus;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  authorId?: string; // UID of the admin creator/editor
}

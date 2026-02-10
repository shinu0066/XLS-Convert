
"use client";

import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/core/loading-spinner';
import { slugify } from '@/lib/utils';
import { createBlogPost, updateBlogPost, uploadBlogThumbnail, checkSlugExists } from '@/lib/firebase-blog-service';
import type { BlogPost, BlogPostStatus } from '@/types/blog';
import { AlertCircle, CheckCircle, UploadCloud, XCircle, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Heading1, Heading2, Heading3, Link as LinkIcon, Image as ImageIcon, Pilcrow, AlignLeft, AlignCenter, AlignRight, Quote, Code, Minus } from 'lucide-react';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import UnderlineExtension from '@tiptap/extension-underline';


const blogPostSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters long." }).max(150),
  shortDescription: z.string().min(10, { message: "Short description must be at least 10 characters." }).max(300),
  slug: z.string().min(3, { message: "Slug is required." }).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, with hyphens."),
  content: z.string().min(50, { message: "Content must be rich and at least 50 characters long." }),
  status: z.enum(['draft', 'published']),
});

type BlogPostFormValues = z.infer<typeof blogPostSchema>;

interface BlogPostFormProps {
  existingPost?: BlogPost | null;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border border-input rounded-t-md bg-muted/50">
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} title="Bold"> <Bold className="h-4 w-4" /> </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} title="Italic"> <Italic className="h-4 w-4" /> </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''} title="Underline"> <Underline className="h-4 w-4" /> </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''} title="Strikethrough"> <Strikethrough className="h-4 w-4" /> </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''} title="Heading 1"> <Heading1 className="h-4 w-4" /> </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''} title="Heading 2"> <Heading2 className="h-4 w-4" /> </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''} title="Heading 3"> <Heading3 className="h-4 w-4" /> </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''} title="Bullet List"> <List className="h-4 w-4" /> </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''} title="Ordered List"> <ListOrdered className="h-4 w-4" /> </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''} title="Blockquote"> <Quote className="h-4 w-4" /> </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? 'is-active' : ''} title="Code Block"> <Code className="h-4 w-4" /> </Button>
      <Button type="button" variant="ghost" size="icon" onClick={setLink} disabled={!editor.can().setLink({ href: '' })} className={editor.isActive('link') ? 'is-active' : ''} title="Add/Edit Link"> <LinkIcon className="h-4 w-4" /> </Button>
      <Button type="button" variant="ghost" size="icon" onClick={addImage} title="Add Image"> <ImageIcon className="h-4 w-4" /> </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule"> <Minus className="h-4 w-4" /> </Button>
    </div>
  );
};


export default function BlogPostForm({ existingPost }: BlogPostFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(existingPost?.thumbnailImageUrl || null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!existingPost?.slug);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const { control, register, handleSubmit, watch, setValue, getValues, formState: { errors, isDirty } } = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: existingPost?.title || '',
      shortDescription: existingPost?.shortDescription || '',
      slug: existingPost?.slug || '',
      content: existingPost?.content || '<p>Start writing your amazing blog post here...</p>', // Default content for TipTap
      status: existingPost?.status || 'draft',
    },
  });

  const watchedTitle = watch('title');
  const watchedSlug = watch('slug');

  useEffect(() => {
    if (watchedTitle && !slugManuallyEdited && !existingPost) { 
      const newSlug = slugify(watchedTitle);
      setValue('slug', newSlug, { shouldValidate: true, shouldDirty: true });
    }
  }, [watchedTitle, slugManuallyEdited, setValue, existingPost]);
  
  const debouncedCheckSlug = useCallback(
    debounce(async (slugToTest: unknown) => {
      if (typeof slugToTest !== 'string') return;
      if (!slugToTest) {
        setSlugAvailable(null);
        return;
      }
      const isTaken = await checkSlugExists(slugToTest, existingPost?.id);
      setSlugAvailable(!isTaken);
    }, 500),
    [existingPost?.id] 
  );

  useEffect(() => {
    if (watchedSlug) {
      debouncedCheckSlug(watchedSlug);
    }
  }, [watchedSlug, debouncedCheckSlug]);


  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const onSubmitHandler: SubmitHandler<BlogPostFormValues> = async (data, event) => {
    const nativeEvent = event?.nativeEvent;
    const clickedButton = nativeEvent && 'submitter' in nativeEvent 
      ? (nativeEvent.submitter as HTMLButtonElement | null)
      : null;
    const statusToSet = clickedButton?.id === 'publish-button' ? 'published' : 'draft';
    
    setIsLoading(true);

    if (!data.slug || (slugAvailable === false && data.slug !== existingPost?.slug)) {
      toast({ variant: "destructive", title: "Slug Error", description: "Please provide a unique and valid slug." });
      setIsLoading(false);
      return;
    }
    
    try {
      let thumbnailUrl = existingPost?.thumbnailImageUrl || null;
      if (thumbnailFile) {
        setIsUploading(true);
        thumbnailUrl = await uploadBlogThumbnail(thumbnailFile, existingPost?.id);
        setIsUploading(false);
      } else if (!thumbnailPreview && existingPost?.thumbnailImageUrl) {
        thumbnailUrl = null; 
      }

      const postDataToSave: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'slug'> = {
        title: data.title,
        shortDescription: data.shortDescription,
        content: data.content,
        thumbnailImageUrl: thumbnailUrl,
        status: statusToSet as BlogPostStatus,
      };
      
      if (existingPost?.id) {
        await updateBlogPost(existingPost.id, postDataToSave, data.slug);
        toast({ title: "Blog Post Updated", description: `"${data.title}" has been successfully updated.` });
      } else {
        const newPostId = await createBlogPost(postDataToSave, data.slug);
        toast({ title: "Blog Post Created", description: `"${data.title}" has been successfully created.` });
      }
      router.push('/admin/blog-manager');
      router.refresh(); 
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Could not save the blog post.";
      console.error("Error saving blog post:", error);
      toast({ variant: "destructive", title: "Save Error", description: errorMessage });
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} placeholder="Enter blog post title" disabled={isLoading} />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="slug">Slug</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="slug" 
                {...register('slug')} 
                placeholder="e.g., my-awesome-post" 
                disabled={isLoading}
                onChange={(e) => {
                  setValue('slug', slugify(e.target.value), { shouldValidate: true });
                  setSlugManuallyEdited(true);
                }}
              />
              {slugAvailable === true && <CheckCircle className="h-5 w-5 text-green-500" />}
              {slugAvailable === false && watchedSlug !== existingPost?.slug && <AlertCircle className="h-5 w-5 text-destructive" />}
            </div>
            {errors.slug && <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>}
            {slugAvailable === false && watchedSlug !== existingPost?.slug && <p className="text-sm text-destructive mt-1">This slug is already taken. Please choose another.</p>}
             <p className="text-xs text-muted-foreground mt-1">URL-friendly version of the title. Auto-generated, but can be customized.</p>
          </div>

          <div>
            <Label htmlFor="shortDescription">Short Description (Max 300 chars)</Label>
            <Textarea 
              id="shortDescription" 
              {...register('shortDescription')} 
              placeholder="A brief summary for previews..." 
              rows={3} 
              maxLength={300}
              disabled={isLoading} 
            />
            {errors.shortDescription && <p className="text-sm text-destructive mt-1">{errors.shortDescription.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thumbnail Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {thumbnailPreview ? (
              <div className="relative w-32 h-32 rounded-md overflow-hidden border">
                <Image src={thumbnailPreview} alt="Thumbnail preview" fill className="object-cover" sizes="128px" data-ai-hint="blog thumbnail" />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-md border border-dashed flex items-center justify-center bg-muted/50">
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="space-y-2">
              <Input 
                id="thumbnailImage" 
                type="file" 
                accept="image/png, image/jpeg, image/webp" 
                onChange={handleThumbnailChange} 
                className="max-w-xs"
                disabled={isLoading || isUploading}
              />
              {thumbnailPreview && (
                <Button type="button" variant="outline" size="sm" onClick={removeThumbnail} disabled={isLoading || isUploading}>
                  <XCircle className="mr-2 h-4 w-4" />Remove Thumbnail
                </Button>
              )}
              <p className="text-xs text-muted-foreground">Recommended size: 800x400px. Max 2MB.</p>
            </div>
          </div>
          {isUploading && <LoadingSpinner message="Uploading thumbnail..." />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Main Content</CardTitle>
        </CardHeader>
        <CardContent>
          {isClient ? (
            <Controller
              name="content"
              control={control}
              render={({ field }) => {
                // eslint-disable-next-line react-hooks/rules-of-hooks
                const editor = useEditor({
                  extensions: [
                    StarterKit.configure({
                      heading: { levels: [1, 2, 3] },
                      codeBlock: { languageClassPrefix: 'language-' }, // for syntax highlighting if you add it later
                    }),
                    UnderlineExtension,
                    TiptapLink.configure({
                      openOnClick: false,
                      autolink: true,
                      linkOnPaste: true,
                    }),
                    TiptapImage.configure({
                      inline: false, // Allow images to be block elements
                      allowBase64: true, // Example: Allow pasting base64 images
                    }),
                    Placeholder.configure({
                       placeholder: 'Write your amazing blog post here...',
                    }),
                  ],
                  content: field.value,
                  onUpdate: ({ editor }) => {
                    field.onChange(editor.getHTML());
                  },
                  editorProps: {
                    attributes: {
                      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none focus:outline-none min-h-[250px] p-3 border border-input rounded-b-md',
                    },
                  },
                });

                // eslint-disable-next-line react-hooks/rules-of-hooks
                useEffect(() => {
                  return () => {
                    editor?.destroy();
                  };
                }, [editor]);

                return (
                  <div>
                    <MenuBar editor={editor} />
                    <EditorContent editor={editor} />
                  </div>
                );
              }}
            />
          ) : (
             <div className="h-[200px] w-full rounded-md border border-input animate-pulse bg-muted/50 flex items-center justify-center"><p>Loading editor...</p></div>
          )}
          {errors.content && <p className="text-sm text-destructive mt-2">{errors.content.message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status & Actions</CardTitle>
        </CardHeader>
        <CardContent>
           <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Set status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t pt-6">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/blog-manager')} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            id="save-draft-button"
            variant="secondary" 
            disabled={isLoading || isUploading || (slugAvailable === false && watch('slug') !== existingPost?.slug)}
          >
            {isLoading ? <LoadingSpinner message="Saving..." /> : 'Save Draft'}
          </Button>
          <Button 
            type="submit"
            id="publish-button"
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={isLoading || isUploading || (slugAvailable === false && watch('slug') !== existingPost?.slug)}
          >
            {isLoading ? <LoadingSpinner message="Publishing..." /> : (existingPost?.status === 'published' ? 'Update Published Post' : 'Publish')}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function debounce<F extends (...args: unknown[]) => unknown>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
}

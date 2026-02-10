
"use client"; 

import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import emailjs from '@emailjs/browser';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import LoadingSpinner from '@/components/core/loading-spinner';
import { Mail, Phone, MapPin } from "lucide-react";
import type { GeneralSiteSettings } from '@/types/site-settings';
import { subscribeToGeneralSettings } from '@/lib/firebase-settings-service';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const GENERIC_APP_NAME = "Our Company";
const ADMIN_EMAIL_RECIPIENT = "info@bankstatementconverted.com"; // Updated recipient email

const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;


// Helper to update meta tags
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

export default function ContactPage() {
  const [displayedSiteTitle, setDisplayedSiteTitle] = useState<string>(GENERIC_APP_NAME);
  const [contactEmail, setContactEmail] = useState<string>(ADMIN_EMAIL_RECIPIENT); // Set initial state to the correct email
  const [supportEmail, setSupportEmail] = useState<string>(ADMIN_EMAIL_RECIPIENT); // Set initial state to the correct email
  const pathname = usePathname();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  useEffect(() => {
    const unsubscribe = subscribeToGeneralSettings((settings) => {
      const currentSiteTitle = settings?.siteTitle || GENERIC_APP_NAME;
      setDisplayedSiteTitle(currentSiteTitle);
      
      // We will now consistently use the hardcoded email address
      setContactEmail(ADMIN_EMAIL_RECIPIENT);
      setSupportEmail(ADMIN_EMAIL_RECIPIENT);

      const seoData = settings?.seoSettings?.[pathname];
      const pageTitle = seoData?.title || `Contact ${currentSiteTitle}`;
      const pageDescription = seoData?.description || `Get in touch with ${currentSiteTitle}.`;
      
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


  const onSubmit: SubmitHandler<ContactFormValues> = async (data) => {
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
        toast({
            variant: "destructive",
            title: "Service Not Configured",
            description: "The contact form is not set up correctly. Please contact support.",
        });
        return;
    }

    setIsSending(true);

    const templateParams = {
        to_email: ADMIN_EMAIL_RECIPIENT,
        from_name: data.name,
        from_email: data.email,
        subject: data.subject,
        message: data.message,
        invite_link: 'N/A - Contact Form Submission', 
        to_name: 'Admin',
    };

    try {
        await emailjs.send(serviceId, templateId, templateParams, publicKey);
        toast({
            title: "Message Sent!",
            description: "Thank you for contacting us. We will get back to you shortly.",
        });
        form.reset();
    } catch (error) {
        console.error("Failed to send email via EmailJS:", error);
        toast({
            variant: "destructive",
            title: "Failed to Send",
            description: "An error occurred while sending your message. Please try again.",
        });
    } finally {
        setIsSending(false);
    }
  };


  return (
    <div className="space-y-12">
      <section className="text-center py-10 bg-card shadow-lg rounded-lg">
        <h1 className="text-5xl font-extrabold text-primary mb-4">Get in Touch</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          We&apos;d love to hear from you! Whether you have a question, feedback, or just want to say hello, feel free to reach out.
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-10">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Contact Form</CardTitle>
            <CardDescription>Send us a message directly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="name">Full Name</Label>
                      <FormControl>
                        <Input id="name" placeholder="John Doe" {...field} disabled={isSending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="email">Email Address</Label>
                      <FormControl>
                         <Input id="email" type="email" placeholder="you@example.com" {...field} disabled={isSending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="subject">Subject</Label>
                      <FormControl>
                        <Input id="subject" placeholder="Regarding your service..." {...field} disabled={isSending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="message">Message</Label>
                      <FormControl>
                        <Textarea id="message" placeholder="Your message here..." rows={5} {...field} disabled={isSending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSending}>
                  {isSending ? <LoadingSpinner message="Sending..." /> : "Send Message"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Our Contact Information</CardTitle>
            <CardDescription>Other ways to connect with us.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <div className="flex items-start gap-4">
              <Mail className="h-6 w-6 text-accent mt-1 shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground">Email Us</h3>
                <p>For general inquiries: <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a></p>
                <p>For support: <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">{supportEmail}</a></p>
              </div>
            </div>
             <div className="flex items-start gap-4">
               <div>
                  <h3 className="font-semibold text-foreground">Data Privacy</h3>
                  <p>To understand how we handle your data, please review our <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>.</p>
                  <p className="mt-2">To learn more about our company, visit our <Link href="/about" className="text-primary underline">About Us</Link> page.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="bg-card p-8 rounded-lg shadow-lg mt-12">
        <h2 className="text-3xl font-semibold text-foreground mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-primary">How long does it take to get a response?</h4>
            <p className="text-muted-foreground">We aim to respond to all inquiries within 24-48 business hours.</p>
          </div>
          <div>
            <h4 className="font-medium text-primary">Do you offer enterprise solutions?</h4>
            <p className="text-muted-foreground">Yes, please contact us directly to discuss your enterprise needs and we can tailor a solution for you.</p>
          </div>
        </div>
      </section>
    </div>
  );
}


"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Zap, Users } from "lucide-react";
import type { GeneralSiteSettings } from '@/types/site-settings';
import { subscribeToGeneralSettings } from '@/lib/firebase-settings-service';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const GENERIC_APP_NAME = "Our Application";

// Helper to update meta tags
const updateMeta = (name: string, content: string) => {
    let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);

    // Also update OG tags
    const ogName = `og:${name}`;
     let ogTag = document.querySelector(`meta[property="${ogName}"]`) as HTMLMetaElement;
    if (!ogTag) {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', ogName);
        document.head.appendChild(ogTag);
    }
    ogTag.setAttribute('content', content);
};


export default function AboutPage() {
  const [displayedSiteTitle, setDisplayedSiteTitle] = useState<string>(GENERIC_APP_NAME);
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = subscribeToGeneralSettings((settings) => {
      const currentSiteTitle = settings?.siteTitle || GENERIC_APP_NAME;
      setDisplayedSiteTitle(currentSiteTitle);

      const seoData = settings?.seoSettings?.[pathname];
      const pageTitle = seoData?.title || `About ${currentSiteTitle}`;
      const pageDescription = seoData?.description || `Learn more about ${currentSiteTitle} and our mission.`;
      
      document.title = pageTitle;
      updateMeta('description', pageDescription);
      
      // Update specific OG tags
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

  return (
    <div className="space-y-12">
      <section className="text-center py-10 bg-card shadow-lg rounded-lg">
        <h1 className="text-5xl font-extrabold text-primary mb-4">About {displayedSiteTitle}</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Streamlining your data workflow by effortlessly transforming PDF documents into structured Excel spreadsheets.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-3xl font-semibold text-foreground mb-4">Our Mission</h2>
          <p className="text-lg text-muted-foreground mb-4">
            At {displayedSiteTitle}, our mission is to provide an intuitive, efficient, and reliable solution for individuals and businesses
            to overcome the challenges of manual data extraction from PDFs. We believe in empowering users with tools
            that save time, reduce errors, and enhance productivity. You can try our <Link href="/" className="text-primary underline">PDF to Excel converter</Link> right now or check out our latest updates on our <Link href="/blogs" className="text-primary underline">blog</Link>.
          </p>
          <p className="text-lg text-muted-foreground">
            We leverage cutting-edge AI technology to understand document structures and ensure the highest accuracy in
            your conversions, allowing you to focus on what truly matters – your data insights. If you have any questions, please feel free to <Link href="/contact" className="text-primary underline">contact us</Link>.
          </p>
        </div>
        <div className="flex justify-center">
          <img
            src="https://placehold.co/600x400.png"
            alt="Our team collaborating"
            className="rounded-lg shadow-xl object-cover"
            data-ai-hint="team collaboration"
          />
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-semibold text-foreground mb-8 text-center">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="shadow-md hover:shadow-xl transition-shadow">
            <CardHeader className="items-center">
              <Zap className="h-12 w-12 text-accent mb-3" />
              <CardTitle>Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Convert PDFs to Excel in seconds, not hours. Our streamlined process gets you the data you need, fast.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-xl transition-shadow">
            <CardHeader className="items-center">
              <BrainCircuit className="h-12 w-12 text-accent mb-3" />
              <CardTitle>Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Powered by advanced AI, we ensure precise data extraction and structuring for reliable results.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-xl transition-shadow">
            <CardHeader className="items-center">
              <Users className="h-12 w-12 text-accent mb-3" />
              <CardTitle>User-Focused</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Designed with simplicity in mind. No complex setups, just upload and convert.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-card p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-semibold text-foreground mb-6 text-center">Our Story</h2>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2 flex justify-center">
            <img
              src="https://placehold.co/400x300.png"
              alt="Founding idea sketch"
              className="rounded-lg shadow-md object-cover max-h-60"
              data-ai-hint="idea sketch"
            />
          </div>
          <div className="md:w-1/2">
            <p className="text-lg text-muted-foreground mb-4">
              {displayedSiteTitle} started from a simple observation: too much time was being wasted manually transcribing data
              from PDFs into spreadsheets. We knew there had to be a better way.
            </p>
            <p className="text-lg text-muted-foreground">
              Driven by a passion for technology and a desire to solve real-world problems, our team embarked on a journey
              to create a seamless, AI-driven conversion tool. Today, {displayedSiteTitle} stands as a testament to that vision,
              helping users worldwide unlock the value hidden within their PDF documents.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

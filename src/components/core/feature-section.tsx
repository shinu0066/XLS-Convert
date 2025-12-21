
"use client";

import { memo } from 'react';
import { useState, useEffect } from 'react';
import { ShieldCheck, Download, BrainCircuit, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { GeneralSiteSettings } from '@/types/site-settings';
import { subscribeToGeneralSettings } from '@/lib/firebase-settings-service';
import { useLanguage } from '@/context/language-context';
import { Button } from '../ui/button';
import Link from 'next/link';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
}

const GENERIC_APP_NAME = "Our App";

interface FeatureSectionProps {
  siteTitle?: string; // Allow siteTitle to be passed as a prop
}

const FeatureSection = memo(function FeatureSection({ siteTitle: propSiteTitle }: FeatureSectionProps) {
  const [displayedSiteTitle, setDisplayedSiteTitle] = useState<string>(propSiteTitle || GENERIC_APP_NAME);
  const { getTranslation } = useLanguage();

  useEffect(() => {
    if (!propSiteTitle) { // Only subscribe if title is not passed as a prop
      const unsubscribe = subscribeToGeneralSettings((settings) => {
        setDisplayedSiteTitle(settings?.siteTitle || GENERIC_APP_NAME);
      });
      return () => unsubscribe();
    } else {
        setDisplayedSiteTitle(propSiteTitle);
    }
  }, [propSiteTitle]);

  const features: Feature[] = [
    {
      icon: ShieldCheck,
      title: getTranslation('featureSecure'),
      description: getTranslation('featureSecureDesc'),
    },
    {
      icon: Download,
      title: getTranslation('featureInstant'),
      description: getTranslation('featureInstantDesc'),
    },
    {
      icon: BrainCircuit,
      title: getTranslation('featureAI'),
      description: getTranslation('featureAIDesc'),
    },
  ];

  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-primary mb-2">{getTranslation('featureSectionTitle', { siteTitle: displayedSiteTitle })}</h2>
        <p className="text-lg text-muted-foreground text-center mb-10">
            {getTranslation('featureSectionDescription')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="items-center text-center">
                <feature.icon className="h-12 w-12 text-accent mb-3" />
                <CardTitle className="text-xl font-semibold text-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-muted-foreground">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-12">
            <Button asChild size="lg">
                <Link href="/pricing">View Plans & Pricing</Link>
            </Button>
        </div>
      </div>
    </section>
  );
});

export default FeatureSection;

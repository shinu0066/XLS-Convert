
"use client";

import type React from 'react';
import { useRouter } from 'next/navigation';
import type { User } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Plan, PlanFeature } from '@/config/pricing';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface PricingCardProps {
  plan: Plan;
  billingCycle: 'monthly' | 'annual';
  currentUser: User | null;
}

export default function PricingCard({ plan, billingCycle, currentUser }: PricingCardProps) {
  const router = useRouter();
  const displayPrice = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  const displayConversions = billingCycle === 'monthly' ? plan.monthlyConversions : plan.annualConversions;
  const cycleAdverb = billingCycle === 'monthly' ? 'month' : 'year';

  const handleSelect = () => {
    if (!currentUser) {
      router.push('/login?redirect=/pricing'); // Redirect to login, then back to pricing
    } else {
      // Redirect to the new checkout page with plan details in query params
      router.push(`/checkout?planId=${plan.id}&cycle=${billingCycle}`);
    }
  };

  const ctaButtonText = currentUser ? (plan.trialDays ? `Start ${plan.trialDays}-Day Trial` : "Get Started") : "Sign In to Purchase";

  return (
    <Card className={cn(
      "flex flex-col shadow-lg transition-all duration-300 ease-in-out",
      plan.highlight ? "border-primary border-2 scale-105 ring-4 ring-primary/20" : "hover:shadow-xl",
      "bg-card"
    )}>
      <CardHeader className="items-center text-center p-6">
        {plan.icon && <plan.icon className={cn("h-12 w-12 mb-4", plan.highlight ? "text-primary" : "text-accent")} />}
        <CardTitle className="text-2xl font-bold text-foreground">{plan.name}</CardTitle>
        <CardDescription className="text-muted-foreground h-10">
          {plan.id === 'starter' && `Ideal for individuals and occasional use.`}
          {plan.id === 'professional' && `Perfect for professionals and frequent users.`}
          {plan.id === 'business' && `Tailored for businesses and high-volume needs.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-6 space-y-6">
        <div className="text-center">
          <span className="text-4xl font-extrabold text-foreground">${displayPrice}</span>
          <span className="text-sm text-muted-foreground">/{cycleAdverb}</span>
        </div>
        {plan.trialDays && plan.trialDays > 0 && (
          <div className="text-center text-sm font-medium text-accent-foreground bg-accent/80 p-2 rounded-md flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            Includes {plan.trialDays}-Day Trial Period
          </div>
        )}
        <ul className="space-y-3">
          <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 shrink-0" />
            <span className="text-foreground">
              {displayConversions} conversions/{cycleAdverb}
            </span>
          </li>
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              {feature.available ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5 shrink-0" />
              )}
              <span className={cn(feature.available ? "text-foreground" : "text-muted-foreground line-through")}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="p-6 mt-auto min-h-[80px] flex items-center justify-center">
         <Button 
            onClick={handleSelect} 
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            aria-label={`Select ${plan.name} plan`}
          >
            {ctaButtonText}
          </Button>
      </CardFooter>
    </Card>
  );
}

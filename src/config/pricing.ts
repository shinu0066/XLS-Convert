
import type React from 'react';
import { Package, Zap, Briefcase, CheckCircle2 } from 'lucide-react';

export interface PlanFeature {
  text: string;
  icon?: React.ElementType;
  available: boolean; // To easily show/hide or style differently
}

export interface Plan {
  id: 'starter' | 'professional' | 'business';
  name: string;
  icon: React.ElementType;
  monthlyPrice: number;
  annualPrice: number;
  monthlyConversions: number;
  annualConversions: number;
  features: PlanFeature[];
  ctaText?: string;
  highlight?: boolean;
  trialDays?: number;
  // PayPal Plan IDs
  monthlyPlanId?: string; // e.g., P-XXXXX
  annualPlanId?: string;  // e.g., P-YYYYY
}

export const PRICING_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Package,
    monthlyPrice: 15,
    annualPrice: 90, // $7.5/month effectively
    monthlyConversions: 400,
    annualConversions: 4800,
    trialDays: 7,
    monthlyPlanId: 'P-3UN42152FX9222143NBZ4XIA', 
    annualPlanId: 'P-3UN42152FX9222143NBZ4XIA', // Using same ID for demo
    features: [
      { text: 'Basic PDF layout analysis', icon: CheckCircle2, available: true },
      { text: 'Standard processing speed', icon: CheckCircle2, available: true },
      { text: 'Email support', icon: CheckCircle2, available: true },
      { text: 'Advanced AI structuring', icon: CheckCircle2, available: false },
      { text: 'Priority queue', icon: CheckCircle2, available: false },
    ],
    ctaText: 'Get Started',
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: Zap,
    monthlyPrice: 30,
    annualPrice: 180, // $15/month effectively
    monthlyConversions: 1000,
    annualConversions: 12000,
    trialDays: 7,
    monthlyPlanId: 'P-3UN42152FX9222143NBZ4XIA', // Using same ID for demo
    annualPlanId: 'P-3UN42152FX9222143NBZ4XIA', // Using same ID for demo
    features: [
      { text: 'Advanced AI structuring', icon: CheckCircle2, available: true },
      { text: 'Enhanced processing speed', icon: CheckCircle2, available: true },
      { text: 'Priority email support', icon: CheckCircle2, available: true },
      { text: 'Larger file size limits', icon: CheckCircle2, available: true },
      { text: 'Priority queue', icon: CheckCircle2, available: false },
    ],
    ctaText: 'Get Started',
    highlight: true,
  },
  {
    id: 'business',
    name: 'Business',
    icon: Briefcase,
    monthlyPrice: 50,
    annualPrice: 300, // $25/month effectively
    monthlyConversions: 4000,
    annualConversions: 48000,
    trialDays: 7,
    monthlyPlanId: 'P-3UN42152FX9222143NBZ4XIA', // Using same ID for demo
    annualPlanId: 'P-3UN42152FX9222143NBZ4XIA', // Using same ID for demo
    features: [
      { text: 'Advanced AI structuring', icon: CheckCircle2, available: true },
      { text: 'Highest processing speed', icon: CheckCircle2, available: true },
      { text: '24/7 dedicated support', icon: CheckCircle2, available: true },
      { text: 'Largest file size limits', icon: CheckCircle2, available: true },
      { text: 'Dedicated priority queue', icon: CheckCircle2, available: true },
    ],
    ctaText: 'Get Started',
  },
];

// Helper to get feature text dynamically based on cycle
export const getDynamicFeatureText = (
  baseText: string,
  monthlyValue: number | string,
  annualValue: number | string,
  cycle: 'monthly' | 'annual'
): string => {
  if (baseText.toLowerCase().includes('conversion')) {
    return cycle === 'monthly'
      ? `${monthlyValue} conversions/month`
      : `${annualValue} conversions/year`;
  }
  return baseText;
};

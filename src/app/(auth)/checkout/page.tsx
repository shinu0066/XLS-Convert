
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { PRICING_PLANS, type Plan as PlanType } from '@/config/pricing';
import { activatePlan, type PlanDetails } from '@/lib/local-storage-limits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/core/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, Package, Terminal } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Hardcoded PayPal Client ID to bypass Firebase settings issues.
const PAYPAL_CLIENT_ID = "AZTt9MVK63m_kcmv3r43nZKDotUbgcrz8y4g3dnAJn5FhPsQ9bV5sbYcUfWaELDF1Ij7jYjPaZLhpO-o";


function CheckoutFlow() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { currentUser } = useAuth();
    
    const [isLoading, setIsLoading] = useState(true);

    const planId = searchParams.get('planId') as PlanType['id'];
    const cycle = searchParams.get('cycle') as 'monthly' | 'annual';
    const plan = PRICING_PLANS.find(p => p.id === planId);
    
    useEffect(() => {
        setIsLoading(false); 
        if (!plan || !cycle) {
            toast({ variant: 'destructive', title: 'Invalid Plan', description: 'No plan selected. Redirecting to pricing.' });
            router.push('/pricing');
        }
        if (!currentUser) {
            toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to check out.' });
            router.push('/login');
        }
    }, [plan, cycle, router, toast, currentUser]);

    if (isLoading || !plan || !cycle || !currentUser) {
        return <div className="flex h-64 items-center justify-center"><LoadingSpinner message="Loading checkout..." /></div>;
    }

    const price = cycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
    const paypalPlanId = cycle === 'monthly' ? plan.monthlyPlanId : plan.annualPlanId;
    const conversions = cycle === 'monthly' ? plan.monthlyConversions : plan.annualConversions;
    
    if (!PAYPAL_CLIENT_ID || !paypalPlanId || paypalPlanId.startsWith('REPLACE_')) {
        return (
             <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Configuration Error</AlertTitle>
                <AlertDescription>
                    Payment processing is not configured correctly for this plan.
                    This could be due to a missing PayPal Plan ID for the selected billing cycle.
                    Please contact support.
                </AlertDescription>
            </Alert>
        );
    }
    
    const initialOptions = {
      clientId: PAYPAL_CLIENT_ID,
      vault: true,
      intent: "subscription" as const,
      currency: "USD" as const,
    };

    const handleSuccessfulSubscription = (subscriptionID: string) => {
         const planDetailsToActivate: PlanDetails = {
            id: plan.id,
            name: plan.name,
            conversions: cycle === 'monthly' ? plan.monthlyConversions : plan.annualConversions,
            cycle: cycle,
            price: price,
            trialDays: plan.trialDays,
        };

        const activatedPlan = activatePlan(currentUser.uid, planDetailsToActivate);

        toast({
            title: `${activatedPlan.name} Plan Activated!`,
            description: `Subscription successful! You now have ${activatedPlan.totalConversions} conversions. This plan is billed ${activatedPlan.billingCycle}.`,
            duration: 9000,
        });
        
        // Redirect to the new invoice page
        const queryParams = new URLSearchParams({
            planName: plan.name,
            cycle: cycle,
            price: price.toString(),
            subscriptionId: subscriptionID,
            date: new Date().toISOString(),
        }).toString();

        router.push(`/invoice?${queryParams}`);
    };

    return (
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto">
            {/* Left Side: Order Summary */}
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-primary">Your Order Summary</h1>
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Package className="h-8 w-8 text-accent"/>
                            <div className="flex flex-col">
                                <span className="text-2xl">{plan.name} Plan</span>
                                <span className="text-sm font-normal text-muted-foreground capitalize">{cycle} Subscription</span>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Separator />
                        <ul className="space-y-3 text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500"/>
                                <span>{conversions.toLocaleString()} conversions / {cycle === 'monthly' ? 'month' : 'year'}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500"/>
                                <span>Advanced AI Structuring</span>
                            </li>
                             {plan.trialDays ? (
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-500"/>
                                    <span>{plan.trialDays}-Day Free Trial Included</span>
                                </li>
                             ) : null}
                        </ul>
                         <Separator />
                         <div className="flex justify-between items-center text-lg">
                            <span className="font-medium text-muted-foreground">Total Due Today</span>
                            <span className="font-bold text-foreground">${price.toFixed(2)}</span>
                         </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Side: Payment */}
            <div className="space-y-6">
                 <h2 className="text-3xl font-bold text-primary">Complete Payment</h2>
                 <Card className="shadow-md">
                     <CardHeader>
                        <CardTitle>Choose Payment Method</CardTitle>
                        <CardDescription>
                            Securely complete your subscription with PayPal.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PayPalScriptProvider options={initialOptions}>
                            <PayPalButtons
                                style={{
                                    shape: "rect",
                                    layout: "vertical",
                                    color: "gold",
                                    label: "subscribe",
                                }}
                                createSubscription={(data, actions) => {
                                    return actions.subscription.create({
                                        plan_id: paypalPlanId,
                                    });
                                }}
                                onApprove={(data, actions) => {
                                    toast({ title: 'Processing Subscription...', description: 'Please wait while we finalize your plan.' });
                                    if (data.subscriptionID) {
                                      handleSuccessfulSubscription(data.subscriptionID);
                                    }
                                    // Let the success handler manage the redirect.
                                    return Promise.resolve();
                                }}
                                onError={(err) => {
                                    console.error("PayPal Subscription Error:", err);
                                    toast({ variant: 'destructive', title: 'Payment Error', description: 'An error occurred with the PayPal subscription. Please try again.' });
                                }}
                            />
                        </PayPalScriptProvider>
                        <p className="text-xs text-muted-foreground mt-4 text-center">
                            You will be redirected to PayPal to complete your purchase securely.
                        </p>
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
}

// Parent component to provide Suspense boundary for useSearchParams
export default function CheckoutPage() {
    return (
        <div className="min-h-[calc(100vh-10rem)] py-8 px-4">
             <Suspense fallback={<div className="flex h-64 items-center justify-center"><LoadingSpinner message="Loading checkout..." /></div>}>
                <CheckoutFlow />
            </Suspense>
        </div>
    )
}

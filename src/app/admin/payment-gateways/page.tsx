
"use client";

import React, { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import type { GeneralSiteSettings, PaymentGatewaySetting, PaymentGatewayCredentials } from '@/types/site-settings';
import { getGeneralSettings, updateGeneralSettings, PREDEFINED_PAYMENT_GATEWAYS_CONFIG } from '@/lib/firebase-settings-service';
import LoadingSpinner from '@/components/core/loading-spinner';

const DEFAULT_GATEWAY_SETTINGS: PaymentGatewaySetting[] = PREDEFINED_PAYMENT_GATEWAYS_CONFIG.map(config => ({
  id: config.id,
  name: config.name,
  iconName: config.iconName,
  enabled: false,
  credentials: {},
}));

export default function PaymentGatewaysPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<GeneralSiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentSettings = await getGeneralSettings();
      // Ensure paymentGateways array is initialized and contains all predefined gateways
      const currentGateways = currentSettings?.paymentGateways || [];
      const mergedGateways = PREDEFINED_PAYMENT_GATEWAYS_CONFIG.map(defaultConfig => {
        const savedGateway = currentGateways.find(sg => sg.id === defaultConfig.id);
         const defaultFullGateway = DEFAULT_GATEWAY_SETTINGS.find(dfg => dfg.id === defaultConfig.id)!; // Should always find
        if (savedGateway) {
          return { ...defaultFullGateway, ...savedGateway, credentials: { ...defaultFullGateway.credentials, ...savedGateway.credentials }};
        }
        return defaultFullGateway;
      });

      setSettings({ ...currentSettings, paymentGateways: mergedGateways });
    } catch (error) {
      console.error("Error fetching payment gateway settings:", error);
      toast({ variant: 'destructive', title: 'Error Fetching Settings', description: 'Could not load payment gateway settings.' });
      // Fallback to default structure if fetch fails
      setSettings({ paymentGateways: [...DEFAULT_GATEWAY_SETTINGS] });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleGatewayChange = (gatewayId: PaymentGatewaySetting['id'], field: keyof PaymentGatewaySetting, value: any) => {
    setSettings(prev => {
      if (!prev || !prev.paymentGateways) return prev;
      return {
        ...prev,
        paymentGateways: prev.paymentGateways.map(gw =>
          gw.id === gatewayId ? { ...gw, [field]: value } : gw
        ),
      };
    });
  };

  const handleCredentialChange = (gatewayId: PaymentGatewaySetting['id'], credField: keyof PaymentGatewayCredentials, value: string) => {
    setSettings(prev => {
      if (!prev || !prev.paymentGateways) return prev;
      return {
        ...prev,
        paymentGateways: prev.paymentGateways.map(gw =>
          gw.id === gatewayId ? { ...gw, credentials: { ...gw.credentials, [credField]: value } } : gw
        ),
      };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings || !settings.paymentGateways) return;
    
    // --- VALIDATION START ---
    const paypalGateway = settings.paymentGateways.find(gw => gw.id === 'paypal');
    if (paypalGateway && paypalGateway.enabled) {
        const paypalClientId = paypalGateway.credentials.clientId || '';
        if (paypalClientId.includes('@')) {
            toast({
                variant: 'destructive',
                title: 'Invalid PayPal Client ID',
                description: 'The PayPal Client ID should not be an email address. Please provide the correct API Client ID from your PayPal Developer dashboard.',
                duration: 9000
            });
            return; // Stop submission
        }
    }
    // --- VALIDATION END ---

    setIsSaving(true);
    try {
      await updateGeneralSettings({ paymentGateways: settings.paymentGateways });
      toast({ title: 'Payment Gateway Settings Saved', description: 'Your configurations have been updated successfully.' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Could not save settings.';
      console.error("Error saving payment gateway settings:", error);
      toast({ variant: 'destructive', title: 'Save Error', description: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return <div className="flex h-full items-center justify-center"><LoadingSpinner message="Loading Payment Gateway Settings..." /></div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <LucideIcons.CreditCard className="mr-3 h-7 w-7 text-primary" /> Payment Gateway Management
          </CardTitle>
          <CardDescription>
            Configure and manage payment gateways for your website. Enable gateways and provide the necessary API credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full space-y-4">
            {(settings.paymentGateways || []).map((gateway) => {
              const IconName = gateway.iconName as keyof typeof LucideIcons;
              const IconComponent = (IconName && IconName in LucideIcons && typeof LucideIcons[IconName] === 'function')
                ? (LucideIcons[IconName] as React.ComponentType<React.SVGProps<SVGSVGElement>>)
                : LucideIcons.Landmark;
              const Icon = IconComponent;
              return (
                <AccordionItem value={gateway.id} key={gateway.id} className="border rounded-lg shadow-sm bg-card">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline text-lg font-medium text-primary">
                    <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6" />
                      {gateway.name}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-2 space-y-6 border-t">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`enable-${gateway.id}`} className="text-base font-medium">
                        Enable {gateway.name}
                      </Label>
                      <Switch
                        id={`enable-${gateway.id}`}
                        checked={gateway.enabled}
                        onCheckedChange={(checked) => handleGatewayChange(gateway.id, 'enabled', checked)}
                        disabled={isSaving}
                      />
                    </div>

                    {gateway.enabled && (
                      <div className="space-y-4 pt-4 border-t border-dashed">
                        {gateway.id === 'paypal' && (
                          <div>
                            <Label htmlFor={`paypal-client-id-${gateway.id}`}>PayPal Client ID</Label>
                            <Input
                              id={`paypal-client-id-${gateway.id}`}
                              value={gateway.credentials.clientId || ''}
                              onChange={(e) => handleCredentialChange(gateway.id, 'clientId', e.target.value)}
                              placeholder="Enter PayPal Client ID"
                              disabled={isSaving}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Your public PayPal Client ID for processing payments.</p>
                          </div>
                        )}
                        {/* Add PayPal Client Secret input if needed for your flow, with strong warnings */}
                        {/*
                        <div>
                            <Label htmlFor={`paypal-client-secret-${gateway.id}`}>PayPal Client Secret (Highly Sensitive)</Label>
                            <Input
                                id={`paypal-client-secret-${gateway.id}`}
                                type="password"
                                value={gateway.credentials.clientSecret || ''}
                                onChange={(e) => handleCredentialChange(gateway.id, 'clientSecret', e.target.value)}
                                placeholder="Enter PayPal Client Secret"
                                disabled={isSaving}
                            />
                            <p className="text-xs text-destructive mt-1">Warning: Store server-side in production.</p>
                        </div>
                        */}

                        {gateway.id === 'stripe' && (
                          <>
                            <div>
                              <Label htmlFor={`stripe-publishable-key-${gateway.id}`}>Stripe Publishable Key</Label>
                              <Input
                                id={`stripe-publishable-key-${gateway.id}`}
                                value={gateway.credentials.clientId || ''} // Using clientId for Publishable Key
                                onChange={(e) => handleCredentialChange(gateway.id, 'clientId', e.target.value)}
                                placeholder="pk_live_..."
                                disabled={isSaving}
                              />
                              <p className="text-xs text-muted-foreground mt-1">Your public Stripe Publishable Key.</p>
                            </div>
                            <div>
                              <Label htmlFor={`stripe-secret-key-${gateway.id}`}>Stripe Secret Key (Highly Sensitive)</Label>
                              <Input
                                id={`stripe-secret-key-${gateway.id}`}
                                type="password"
                                value={gateway.credentials.clientSecret || ''} // Using clientSecret for Secret Key
                                onChange={(e) => handleCredentialChange(gateway.id, 'clientSecret', e.target.value)}
                                placeholder="sk_live_..."
                                disabled={isSaving}
                              />
                              <p className="text-xs text-destructive mt-1">Warning: Store server-side in production.</p>
                            </div>
                            <div>
                              <Label htmlFor={`stripe-webhook-secret-${gateway.id}`}>Stripe Webhook Signing Secret (Highly Sensitive)</Label>
                              <Input
                                id={`stripe-webhook-secret-${gateway.id}`}
                                type="password"
                                value={gateway.credentials.webhookSecret || ''} 
                                onChange={(e) => handleCredentialChange(gateway.id, 'webhookSecret', e.target.value)}
                                placeholder="whsec_..."
                                disabled={isSaving}
                              />
                              <p className="text-xs text-destructive mt-1">Warning: Store server-side in production for verifying webhooks.</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      <CardFooter className="flex justify-end mt-8 border-t pt-6">
        <Button type="submit" size="lg" disabled={isSaving || isLoading}>
          {isSaving ? <LoadingSpinner message="Saving Settings..." /> : 'Save Payment Gateway Settings'}
        </Button>
      </CardFooter>
    </form>
  );
}


"use client";

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '@/components/core/loading-spinner';
import AppLogo from '@/components/layout/app-logo';
import { subscribeToGeneralSettings } from '@/lib/firebase-settings-service';
import { Download, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const GENERIC_APP_NAME = "XLSConvert Inc.";

function InvoiceContent() {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const [siteSettings, setSiteSettings] = useState<{ title: string; logoUrl: string | null }>({ title: GENERIC_APP_NAME, logoUrl: null });
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToGeneralSettings((settings) => {
      if (settings) {
        setSiteSettings({ title: settings.siteTitle || GENERIC_APP_NAME, logoUrl: settings.logoUrl ?? null });
      }
    });
    return () => unsubscribe();
  }, []);

  const planName = searchParams.get('planName');
  const cycle = searchParams.get('cycle');
  const price = searchParams.get('price');
  const subscriptionId = searchParams.get('subscriptionId');
  const dateStr = searchParams.get('date');

  const invoiceDate = dateStr ? new Date(dateStr) : new Date();
  
  if (authLoading) {
    return <div className="flex h-64 items-center justify-center"><LoadingSpinner message="Loading user details..." /></div>;
  }
  
  if (!currentUser) {
    router.push('/login');
    return null;
  }

  if (!planName || !cycle || !price || !subscriptionId) {
    return (
      <div className="text-center text-destructive">
        <p>Invalid invoice details. Unable to display.</p>
        <Button onClick={() => router.push('/')} className="mt-4">Go to Homepage</Button>
      </div>
    );
  }

  const handleDownloadPdf = async () => {
    const element = invoiceRef.current;
    if (!element) return;
    setIsDownloading(true);

    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
    });
    const data = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`invoice-${subscriptionId}.pdf`);
    setIsDownloading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <Card className="text-center bg-green-50 border-green-200 shadow-md">
        <CardHeader>
          <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-3">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-700">Payment Successful!</CardTitle>
          <CardDescription className="text-green-600">Your subscription is now active. Thank you for your purchase!</CardDescription>
        </CardHeader>
      </Card>
      
      <div ref={invoiceRef} className="p-4 sm:p-8 bg-card rounded-lg shadow-lg">
        <Card className="border-none shadow-none">
          <CardHeader>
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <AppLogo logoUrl={siteSettings.logoUrl} siteTitle={siteSettings.title} />
                <p className="text-muted-foreground text-sm mt-2">123 Innovation Drive<br/>Tech City, TX 75001, USA</p>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-primary">INVOICE</h2>
                <p className="text-muted-foreground"># {subscriptionId}</p>
              </div>
            </div>
            <Separator className="my-6" />
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <p className="font-semibold text-muted-foreground">BILLED TO</p>
                <p className="text-foreground font-medium">{userProfile?.firstName} {userProfile?.lastName}</p>
                <p className="text-muted-foreground">{currentUser.email}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-muted-foreground">DATE OF ISSUE</p>
                <p className="text-foreground font-medium">{format(invoiceDate, 'MMMM d, yyyy')}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DESCRIPTION</TableHead>
                  <TableHead className="text-right">AMOUNT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <p className="font-medium">{planName} Plan</p>
                    <p className="text-sm text-muted-foreground capitalize">{cycle} Subscription</p>
                  </TableCell>
                  <TableCell className="text-right font-medium">${parseFloat(price).toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Separator className="my-6" />
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${parseFloat(price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (0%)</span>
                  <span>$0.00</span>
                </div>
                <Separator/>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-primary">Total Paid</span>
                  <span className="text-primary">${parseFloat(price).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">
              Thank you for your business! If you have any questions, please contact support.
            </p>
          </CardFooter>
        </Card>
      </div>

      <div className="text-center space-x-4">
        <Button onClick={handleDownloadPdf} disabled={isDownloading}>
          <Download className="mr-2 h-4 w-4" />
          {isDownloading ? 'Downloading...' : 'Download PDF'}
        </Button>
        <Button variant="outline" onClick={() => router.push('/')}>
          Go to Homepage
        </Button>
      </div>
    </div>
  );
}


export default function InvoicePage() {
    return (
        <div className="min-h-[calc(100vh-10rem)] py-8 px-4">
            <Suspense fallback={<div className="flex h-64 items-center justify-center"><LoadingSpinner message="Loading Invoice..." /></div>}>
                <InvoiceContent />
            </Suspense>
        </div>
    )
}

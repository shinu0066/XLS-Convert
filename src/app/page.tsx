"use client";

import { useState, useCallback, useEffect } from 'react';
import FileUploader from '@/components/core/file-uploader';
import LimitDialog from '@/components/core/limit-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Trash2, Zap, FileText, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { uploadPdfAndGetCsv, triggerDownload } from '@/lib/aws-lambda-api';
import { checkConversionLimit, recordConversion, formatTime, getActivePlan, type ActivePlan } from '@/lib/local-storage-limits';
import { getPdfPageCount } from '@/lib/pdf-utils';
import { addToDownloadHistory } from '@/lib/download-history-storage';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [limitDialogContent, setLimitDialogContent] = useState<{
    userType: 'guest' | 'loggedIn';
    timeToWaitFormatted?: string;
    onPlan?: boolean;
    planName?: string;
    isPlanExhausted?: boolean;
  }>({ userType: 'guest' });
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);

  const { toast } = useToast();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      setActivePlan(getActivePlan(currentUser.uid));
    } else {
      setActivePlan(null);
    }
  }, [currentUser]);

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.type !== 'application/pdf') {
      toast({ 
        variant: "destructive",
        title: "Invalid File", 
        description: "Please select a PDF file.",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({ 
        variant: "destructive",
        title: "File Too Large", 
        description: "File must be under 10MB.",
      });
      return;
    }

    const userId = currentUser?.uid ?? null;
    const limitStatus = checkConversionLimit(userId);
    if (!limitStatus.allowed) {
      setLimitDialogContent({
        userType: currentUser ? 'loggedIn' : 'guest',
        timeToWaitFormatted: limitStatus.timeToWaitMs ? formatTime(limitStatus.timeToWaitMs) : undefined,
        onPlan: limitStatus.onPlan,
        planName: limitStatus.planName,
        isPlanExhausted: limitStatus.isPlanExhausted,
      });
      setShowLimitDialog(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setDownloadUrl(null);
    setPdfPageCount(null);
    setSelectedFile(file);
    setLoadingStep("Starting...");

    // Count PDF pages for display (non-blocking)
    file.arrayBuffer().then((buf) => getPdfPageCount(buf)).then((n) => setPdfPageCount(n)).catch(() => setPdfPageCount(null));

    try {
      const csvUrl = await uploadPdfAndGetCsv(file, (step) => {
        setLoadingStep(step);
      });
      
      setDownloadUrl(csvUrl);
      recordConversion(userId);
      if (currentUser) {
        setActivePlan(getActivePlan(currentUser.uid));
      }
      toast({ 
        title: "Success!", 
        description: "CSV is ready!" 
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error:", err);
      setError(errorMessage);
      toast({ 
        variant: "destructive", 
        title: "Failed", 
        description: errorMessage 
      });
      setSelectedFile(null);
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  }, [toast, currentUser]);

  const handleDownload = useCallback(async () => {
    if (downloadUrl && selectedFile) {
      const saved = await addToDownloadHistory(downloadUrl, selectedFile.name);
      if (saved) {
        toast({ title: 'Saved to Documents', description: 'This file was added to your Documents page for 24 hours.' });
      }
      triggerDownload(downloadUrl, selectedFile.name);
    }
  }, [downloadUrl, selectedFile, toast]);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setDownloadUrl(null);
    setError(null);
    setPdfPageCount(null);
  }, []);

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Zap className="h-8 w-8" /> Bank Statement Converter
          </h1>
          <CardDescription className="text-lg">
            Convert PDF to CSV
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!downloadUrl ? (
            <FileUploader 
              onFilesSelect={handleFileSelect}
              disabled={isLoading}
              isSubscribed={!!(activePlan && activePlan.usedConversions < activePlan.totalConversions)}
              dragText="Drop PDF here"
              orText="or"
              clickText="Browse files"
            />
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5"/>
                    <CardTitle>Ready!</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleClear}>
                      <Trash2 className="mr-2 h-4 w-4"/>
                      New File
                    </Button>
                    <Button size="sm" onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4"/>
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  <strong>{selectedFile?.name}</strong>
                  {pdfPageCount != null && (
                    <span className="text-muted-foreground"> ({pdfPageCount} {pdfPageCount === 1 ? 'page' : 'pages'})</span>
                  )}
                  {' '}converted successfully!
                </p>
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <div className="py-10 text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm">{loadingStep}</p>
            </div>
          )}

          {error && !isLoading && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <LimitDialog
        isOpen={showLimitDialog}
        onOpenChange={setShowLimitDialog}
        userType={limitDialogContent.userType}
        timeToWaitFormatted={limitDialogContent.timeToWaitFormatted}
        onPlan={limitDialogContent.onPlan}
        planName={limitDialogContent.planName}
        isPlanExhausted={limitDialogContent.isPlanExhausted}
      />
    </div>
  );
}


"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import FileUploader from '@/components/core/file-uploader';
import DataPreview from '@/components/core/data-preview';
import LimitDialog from '@/components/core/limit-dialog';
import LoadingSpinner from '@/components/core/loading-spinner';
import dynamic from 'next/dynamic';

// Lazy load FeatureSection to reduce initial bundle size
const FeatureSection = dynamic(() => import('@/components/core/feature-section'), {
  loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" />,
  ssr: true, // Keep SSR for SEO
});
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Download, Trash2, Zap, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { checkConversionLimit, recordConversion, formatTime, type LimitStatus, getActivePlan, type ActivePlan } from '@/lib/local-storage-limits';
import { exportToExcel } from '@/lib/excel-export';
import type { StructuredPdfDataOutput, Transaction } from '@/ai/flows/structure-pdf-data-flow';
import { useSettings } from '@/context/settings-context';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { ProcessingCancelledError, isProcessingCancelledError } from '@/types/errors';

const MIN_TEXT_LENGTH_FOR_TEXT_PDF = 100;
const GENERIC_APP_NAME = "PDF to Excel Converter";
const STORAGE_KEY = 'XLSCONVERT_DOWNLOADED_FILES';
const MAX_FILE_COUNT = 12;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

interface StoredExcelFile {
    name: string;
    data: Array<Array<string | number | null>>;
    timestamp: number;
}

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

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelReadyData, setExcelReadyData] = useState<Array<Array<string | number | null>> | null>(null);
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

  const { currentUser } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const { settings } = useSettings();
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);
  const { getTranslation } = useLanguage();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const displayedSiteTitle = useMemo(() => 
    settings?.siteTitle || GENERIC_APP_NAME,
    [settings?.siteTitle]
  );

  useEffect(() => {
    if (currentUser) {
      setActivePlan(getActivePlan(currentUser.uid));
    } else {
      setActivePlan(null);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!settings) return;
    
    const currentSiteTitle = settings.siteTitle || GENERIC_APP_NAME;
    const seoData = settings.seoSettings?.[pathname];
    const pageTitle = seoData?.title || currentSiteTitle;
    const pageDescription = seoData?.description || "Easily convert your PDF files to structured Excel spreadsheets with AI.";
    
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
  }, [settings, pathname]);

  // Cleanup: abort any ongoing processing when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (!files || files.length === 0) return;
    const fileToProcess = files[0];

    // Check file size and warn for very large files (>50MB)
    const MAX_FILE_SIZE_WARNING = 50 * 1024 * 1024; // 50MB
    if (fileToProcess.size > MAX_FILE_SIZE_WARNING) {
      const fileSizeMB = (fileToProcess.size / (1024 * 1024)).toFixed(1);
      toast({ 
        variant: "default", 
        title: "Large File Detected", 
        description: `This file is ${fileSizeMB}MB. Processing may take longer and use more memory.`,
        duration: 5000
      });
    }

    const userId = currentUser ? currentUser.uid : null;
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
    setExcelReadyData(null);
    setSelectedFile(fileToProcess); // Set selected file early
    setLoadingStep("Processing your PDF, please wait...");

    // Create new AbortController for this processing operation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const signal = abortController.signal;

    let fileBuffer: ArrayBuffer | null = null;
    try {
      fileBuffer = await fileToProcess.arrayBuffer();
      
      if (signal.aborted) {
        throw new ProcessingCancelledError();
      }
      
      setLoadingStep("Loading processing modules...");
      
      // Dynamically import heavy dependencies to reduce initial bundle size
      const [
        { extractTextFromPdf, convertPdfPagesToImageUrisIncremental, formatStructuredDataForExcel },
        { extractTextFromImage: extractTextFromImageAI },
        { structurePdfData: structurePdfDataAI }
      ] = await Promise.all([
        import('@/lib/pdf-utils'),
        import('@/ai/flows/extract-text-from-image'),
        import('@/ai/flows/structure-pdf-data-flow')
      ]);

      setLoadingStep("Extracting text from PDF...");
      // Pass a clone of the buffer to prevent it from being detached.
      const directText = await extractTextFromPdf(fileBuffer.slice(0), signal);
      let rawTextOutput: string;

      if (directText && directText.length > MIN_TEXT_LENGTH_FOR_TEXT_PDF) {
        rawTextOutput = directText;
      } else {
        setLoadingStep("PDF has no text, using OCR to scan pages...");
        // Use incremental processing to avoid loading all pages into memory at once
        let ocrTextFromAllPages = '';
        
        await convertPdfPagesToImageUrisIncremental(
          fileBuffer.slice(0),
          async (imageUri, pageNum, totalPages) => {
            if (signal.aborted) {
              throw new ProcessingCancelledError();
            }
            
            setLoadingStep(`Scanning page ${pageNum} of ${totalPages}...`);
            
            try {
              // Check for cancellation before calling server action
              if (signal.aborted) {
                throw new ProcessingCancelledError();
              }
              const result = await extractTextFromImageAI({ photoDataUri: imageUri });
              if (result?.extractedText) {
                ocrTextFromAllPages += result.extractedText + '\n\n';
              }
            } catch (error) {
              // Handle cancellation
              if (isProcessingCancelledError(error) || (error instanceof Error && error.name === 'AbortError')) {
                throw error;
              }
              console.error(`Error processing page ${pageNum}:`, error);
              // Continue with other pages even if one fails
              console.warn(`Page ${pageNum} OCR failed, continuing with other pages...`);
            }
            // Image URI is automatically released after callback completes
          },
          signal
        );
        
        if (!ocrTextFromAllPages) throw new Error("OCR failed to extract any text from the document.");
        rawTextOutput = ocrTextFromAllPages;
      }

      if (signal.aborted) {
        throw new ProcessingCancelledError();
      }

      setLoadingStep("Structuring data with AI...");
      // Check for cancellation before calling server action (AbortSignal cannot be passed to server actions)
      if (signal.aborted) {
        throw new ProcessingCancelledError();
      }
      const structuredDataResult = await structurePdfDataAI({ rawText: rawTextOutput });

      // Clear raw text output to free memory (no longer needed after structuring)
      rawTextOutput = '';

      setLoadingStep("Preparing Excel data...");
      const formattedData = formatStructuredDataForExcel(structuredDataResult);
      setExcelReadyData(formattedData);
      
      // Clear structured data to free memory (formatted data is what we need)
      // Note: structuredDataResult is a local variable, will be GC'd automatically
      
      recordConversion(userId);
      toast({ title: "Conversion Successful", description: "Your data is ready for download." });

    } catch (err: unknown) {
      // Handle cancellation gracefully
      if (isProcessingCancelledError(err) || (err instanceof Error && err.name === 'AbortError')) {
        setError(null);
        setSelectedFile(null);
        setExcelReadyData(null);
        toast({ title: "Processing Cancelled", description: "The conversion was cancelled.", duration: 3000 });
      } else {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during conversion.";
        console.error("Detailed error in handleFileSelect:", err);
        setError(errorMessage);
        toast({ variant: "destructive", title: "Conversion Failed", description: errorMessage, duration: 9000 });
        // Clear file selection on error to free memory
        setSelectedFile(null);
        setExcelReadyData(null);
      }
    } finally {
      // Clear file buffer reference to help with garbage collection
      fileBuffer = null;
      // Clear abort controller reference
      abortControllerRef.current = null;
      setIsLoading(false);
      setLoadingStep("");
    }
  }, [currentUser, toast]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (excelReadyData && selectedFile) {
        const originalFileName = selectedFile.name.replace(/\.[^/.]+$/, "") + ".xlsx";
        exportToExcel(excelReadyData, originalFileName);

        // Store file in local storage
        if (typeof window !== 'undefined') {
            try {
                const storedData = localStorage.getItem(STORAGE_KEY);
                let files: StoredExcelFile[] = storedData ? JSON.parse(storedData) : [];
                const now = Date.now();

                // Filter out files older than 24 hours
                files = files.filter(file => (now - file.timestamp) < TWENTY_FOUR_HOURS_MS);

                // Add the new file
                const newFile: StoredExcelFile = {
                    name: originalFileName,
                    data: excelReadyData,
                    timestamp: now,
                };
                files.unshift(newFile); // Add to the beginning

                // Keep only the most recent files
                if (files.length > MAX_FILE_COUNT) {
                    files.length = MAX_FILE_COUNT;
                }

                localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
                toast({ title: "File Saved", description: "This download has been saved to your Documents page for 24 hours." });

            } catch (e) {
                console.error("Failed to save file to local storage", e);
                toast({ variant: "destructive", title: "Could Not Save History", description: "There was an error saving this file to your local history." });
            }
        }
        
        // Clear large data arrays from state after download to free memory
        setTimeout(() => {
          setExcelReadyData(null);
          setSelectedFile(null);
        }, 1000); // Small delay to ensure download started
    }
  }, [excelReadyData, selectedFile, toast]);

  const handleClearSelection = useCallback(() => {
    setSelectedFile(null);
    setExcelReadyData(null);
    setError(null);
    setLoadingStep("");
  }, []);

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <h1 className="text-3xl font-bold text-primary flex items-center justify-center">
            <Zap className="mr-2 h-8 w-8" /> {getTranslation('pageTitle')}
          </h1>
          <CardDescription className="text-lg text-muted-foreground">
            {getTranslation('pageDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!excelReadyData ? (
            <FileUploader 
              onFilesSelect={handleFileSelect}
              disabled={isLoading}
              isSubscribed={false}
              dragText={getTranslation('fileUploaderDrag')}
              orText={getTranslation('fileUploaderOr')}
              clickText={getTranslation('fileUploaderClick')}
            />
          ) : (
             <div className="space-y-4">
               <Card>
                 <CardHeader className="flex flex-row items-center justify-between">
                   <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary"/>
                    <CardTitle className="text-xl">Conversion Preview</CardTitle>
                   </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleClearSelection}><Trash2 className="mr-2 h-4 w-4"/>Start Over</Button>
                      <Button size="sm" onClick={handleDownload}><Download className="mr-2 h-4 w-4"/>Download Excel</Button>
                    </div>
                 </CardHeader>
                 <CardContent>
                    <DataPreview data={excelReadyData} />
                 </CardContent>
               </Card>
            </div>
          )}

          {isLoading && (
            <div className="py-10 space-y-4">
              <LoadingSpinner message={loadingStep || 'Processing...'} />
              <div className="flex justify-center">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel Processing
                </Button>
              </div>
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

      <FeatureSection siteTitle={displayedSiteTitle} />
    </div>
  );
}

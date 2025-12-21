
"use client";

import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { StructuredPdfDataOutput } from '@/ai/flows/structure-pdf-data-flow';
import { ProcessingCancelledError, NetworkError } from '@/types/errors';
import { logError } from '@/lib/error-handler';

// Cache worker initialization to prevent multiple loads
let workerInitialized = false;

// Set the worker source using CDN for Next.js compatibility
// import.meta.url doesn't work reliably in Next.js client components, especially in production
if (typeof window !== 'undefined' && !workerInitialized) {
  // Use CDN-based worker URL for reliable loading across all environments
  // This ensures the worker loads correctly in both development and production builds
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  workerInitialized = true;
}

/**
 * Extracts raw text from a PDF ArrayBuffer.
 * @param pdfBuffer The ArrayBuffer of the PDF file.
 * @param signal Optional AbortSignal to cancel the operation.
 * @returns A promise that resolves with the extracted text.
 */
export async function extractTextFromPdf(pdfBuffer: ArrayBuffer, signal?: AbortSignal): Promise<string> {
  let pdf: PDFDocumentProxy | null = null;
  try {
    pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      if (signal?.aborted) {
        throw new Error('PDF text extraction was cancelled');
      }
      const page: PDFPageProxy = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => {
          if ('str' in item && typeof item.str === 'string') {
            return item.str;
          }
          return '';
        })
        .join(' ');
      fullText += pageText + '\n\n'; // Add extra newline for page breaks
    }
    return fullText.trim();
  } catch (error) {
    if (signal?.aborted || (error instanceof Error && error.message.includes('cancelled'))) {
      throw new ProcessingCancelledError('PDF text extraction was cancelled');
    }
    
    logError(error, { operation: 'extractTextFromPdf' });
    
    // Check for network-related errors
    if (error instanceof Error && (error.message.includes('network') || error.message.includes('fetch'))) {
      throw new NetworkError('Network error while extracting text from PDF. Please check your connection and try again.');
    }
    
    throw new Error("Failed to extract text from PDF. Please ensure the file is a valid PDF.");
  } finally {
    // Clean up PDF document to free memory
    if (pdf) {
      try {
        pdf.destroy();
      } catch (cleanupError) {
        console.warn("Error cleaning up PDF document:", cleanupError);
      }
    }
  }
}

/**
 * Converts all pages of a PDF ArrayBuffer into image data URIs.
 * Optimized for memory: uses JPEG format and lower scale for OCR.
 * @param pdfBuffer The ArrayBuffer of the PDF file.
 * @param signal Optional AbortSignal to cancel the operation.
 * @returns A promise that resolves with an array of image data URIs.
 */
export async function convertAllPdfPagesToImageUris(pdfBuffer: ArrayBuffer, signal?: AbortSignal): Promise<string[]> {
  let pdf: PDFDocumentProxy | null = null;
  try {
    pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
    const imageUris: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      if (signal?.aborted) {
        throw new Error('PDF to image conversion was cancelled');
      }
      const page: PDFPageProxy = await pdf.getPage(pageNum);
      // Reduced scale from 1.5 to 1.2 for better memory efficiency (sufficient for OCR)
      const viewport = page.getViewport({ scale: 1.2 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error("Could not get canvas context.");
      }
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;
      
      // Use JPEG instead of PNG for ~70% smaller file size (sufficient quality for OCR)
      imageUris.push(canvas.toDataURL('image/jpeg', 0.85));
      
      // Clean up canvas to release memory
      context.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 0;
      canvas.height = 0;
    }
    return imageUris;
  } catch (error) {
    if (signal?.aborted || (error instanceof Error && error.message.includes('cancelled'))) {
      throw new ProcessingCancelledError('PDF to image conversion was cancelled');
    }
    
    logError(error, { operation: 'convertAllPdfPagesToImageUris' });
    
    // Check for network-related errors
    if (error instanceof Error && (error.message.includes('network') || error.message.includes('fetch'))) {
      throw new NetworkError('Network error while converting PDF pages to images. Please check your connection and try again.');
    }
    
    throw new Error("Failed to convert PDF pages to images. Please ensure the file is a valid PDF.");
  } finally {
    // Clean up PDF document to free memory
    if (pdf) {
      try {
        pdf.destroy();
      } catch (cleanupError) {
        console.warn("Error cleaning up PDF document:", cleanupError);
      }
    }
  }
}

/**
 * Processes PDF pages incrementally, converting each page to an image and calling a callback.
 * This is memory-efficient as it processes one page at a time and releases memory immediately.
 * @param pdfBuffer The ArrayBuffer of the PDF file.
 * @param onPageProcessed Callback function called for each page with the image data URI.
 * @param signal Optional AbortSignal to cancel the operation.
 * @returns A promise that resolves when all pages are processed.
 */
export async function convertPdfPagesToImageUrisIncremental(
  pdfBuffer: ArrayBuffer,
  onPageProcessed: (imageUri: string, pageNum: number, totalPages: number) => Promise<void>,
  signal?: AbortSignal
): Promise<void> {
  let pdf: PDFDocumentProxy | null = null;
  try {
    pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (signal?.aborted) {
        throw new Error('PDF to image conversion was cancelled');
      }
      
      const page: PDFPageProxy = await pdf.getPage(pageNum);
      // Reduced scale from 1.5 to 1.0 for maximum memory efficiency (sufficient for OCR)
      const viewport = page.getViewport({ scale: 1.0 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error("Could not get canvas context.");
      }
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;
      
      // Use JPEG for smaller file size
      const imageUri = canvas.toDataURL('image/jpeg', 0.85);
      
      // Process the page immediately
      await onPageProcessed(imageUri, pageNum, totalPages);
      
      // Clean up canvas immediately after processing to free memory
      context.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 0;
      canvas.height = 0;
    }
  } catch (error) {
    if (signal?.aborted || (error instanceof Error && error.message.includes('cancelled'))) {
      throw new ProcessingCancelledError('PDF to image conversion was cancelled');
    }
    
    logError(error, { operation: 'convertPdfPagesToImageUrisIncremental' });
    
    // Check for network-related errors
    if (error instanceof Error && (error.message.includes('network') || error.message.includes('fetch'))) {
      throw new NetworkError('Network error while converting PDF pages to images. Please check your connection and try again.');
    }
    
    throw new Error("Failed to convert PDF pages to images. Please ensure the file is a valid PDF.");
  } finally {
    // Clean up PDF document to free memory
    if (pdf) {
      try {
        pdf.destroy();
      } catch (cleanupError) {
        console.warn("Error cleaning up PDF document:", cleanupError);
      }
    }
  }
}


/**
 * Validates transaction data for completeness and accuracy
 */
function validateTransactionData(
  transactions: Array<{date?: string, description?: string, debit?: number, credit?: number, balance?: number | null}>,
  footer?: { totalDebits?: number, totalCredits?: number, totalWithdrawals?: number, totalDeposits?: number, closingBalance?: number }
): {
  isValid: boolean;
  issues: string[];
  accuracyWarnings: string[];
} {
  const issues: string[] = [];
  const accuracyWarnings: string[] = [];
  
  if (!transactions || transactions.length === 0) {
    issues.push("No transactions found");
    return { isValid: false, issues, accuracyWarnings };
  }

  // Check for missing required fields
  transactions.forEach((t, index) => {
    if (!t.date || t.date.trim() === '') {
      issues.push(`Transaction ${index + 1}: Missing date`);
    }
    if (!t.description || t.description.trim() === '') {
      issues.push(`Transaction ${index + 1}: Missing description`);
    }
  });

  // Check for date gaps that might indicate missing transactions
  const dates = transactions
    .map(t => t.date)
    .filter((d): d is string => typeof d === 'string' && d.trim() !== '')
    .sort();
  
  if (dates.length > 1) {
    // Simple check - if there are large gaps, it might indicate missing data
    // This is a basic validation - more sophisticated checks could be added
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const daysDiff = Math.abs((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 30) {
        issues.push(`Potential missing transactions between ${dates[i - 1]} and ${dates[i]}`);
      }
    }
  }

  // Accuracy validation: Compare extracted totals with footer totals
  if (footer) {
    // Calculate extracted totals
    const extractedTotalDebits = transactions
      .map(t => t.debit || 0)
      .reduce((sum, debit) => sum + debit, 0);
    
    const extractedTotalCredits = transactions
      .map(t => t.credit || 0)
      .reduce((sum, credit) => sum + credit, 0);

    // Compare with footer totals (allow small floating point differences)
    const tolerance = 0.01; // 1 cent tolerance for rounding differences
    
    if (footer.totalDebits !== undefined && footer.totalDebits !== null) {
      const diff = Math.abs(extractedTotalDebits - footer.totalDebits);
      if (diff > tolerance) {
        accuracyWarnings.push(
          `Total debits mismatch: Extracted ${extractedTotalDebits.toFixed(2)}, Footer shows ${footer.totalDebits.toFixed(2)} (Difference: ${diff.toFixed(2)})`
        );
      }
    }

    if (footer.totalCredits !== undefined && footer.totalCredits !== null) {
      const diff = Math.abs(extractedTotalCredits - footer.totalCredits);
      if (diff > tolerance) {
        accuracyWarnings.push(
          `Total credits mismatch: Extracted ${extractedTotalCredits.toFixed(2)}, Footer shows ${footer.totalCredits.toFixed(2)} (Difference: ${diff.toFixed(2)})`
        );
      }
    }

    // Check closing balance if available
    if (footer.closingBalance !== undefined && footer.closingBalance !== null && transactions.length > 0) {
      const lastTransaction = transactions[transactions.length - 1];
      if (lastTransaction.balance !== null && lastTransaction.balance !== undefined) {
        const diff = Math.abs(lastTransaction.balance - footer.closingBalance);
        if (diff > tolerance) {
          accuracyWarnings.push(
            `Closing balance mismatch: Last transaction balance ${lastTransaction.balance.toFixed(2)}, Footer shows ${footer.closingBalance.toFixed(2)} (Difference: ${diff.toFixed(2)})`
          );
        }
      }
    }

    // Check total withdrawals/deposits if available
    if (footer.totalWithdrawals !== undefined && footer.totalWithdrawals !== null) {
      const diff = Math.abs(extractedTotalDebits - footer.totalWithdrawals);
      if (diff > tolerance) {
        accuracyWarnings.push(
          `Total withdrawals mismatch: Extracted ${extractedTotalDebits.toFixed(2)}, Footer shows ${footer.totalWithdrawals.toFixed(2)} (Difference: ${diff.toFixed(2)})`
        );
      }
    }

    if (footer.totalDeposits !== undefined && footer.totalDeposits !== null) {
      const diff = Math.abs(extractedTotalCredits - footer.totalDeposits);
      if (diff > tolerance) {
        accuracyWarnings.push(
          `Total deposits mismatch: Extracted ${extractedTotalCredits.toFixed(2)}, Footer shows ${footer.totalDeposits.toFixed(2)} (Difference: ${diff.toFixed(2)})`
        );
      }
    }
  }

  // Validate numeric precision - check for potential rounding issues
  transactions.forEach((t, index) => {
    if (t.debit !== undefined && t.debit !== null) {
      const decimalPlaces = (t.debit.toString().split('.')[1] || '').length;
      if (decimalPlaces > 2) {
        accuracyWarnings.push(`Transaction ${index + 1}: Debit has more than 2 decimal places (${t.debit})`);
      }
    }
    if (t.credit !== undefined && t.credit !== null) {
      const decimalPlaces = (t.credit.toString().split('.')[1] || '').length;
      if (decimalPlaces > 2) {
        accuracyWarnings.push(`Transaction ${index + 1}: Credit has more than 2 decimal places (${t.credit})`);
      }
    }
    if (t.balance !== undefined && t.balance !== null) {
      const decimalPlaces = (t.balance.toString().split('.')[1] || '').length;
      if (decimalPlaces > 2) {
        accuracyWarnings.push(`Transaction ${index + 1}: Balance has more than 2 decimal places (${t.balance})`);
      }
    }
  });

  return {
    isValid: issues.length === 0,
    issues,
    accuracyWarnings
  };
}

/**
 * Formats structured PDF data for Excel export, including headers and footers
 * Returns data with proper types (numbers for numeric fields, strings for text)
 */
export function formatStructuredDataForExcel(structuredData: StructuredPdfDataOutput | null): Array<Array<string | number | null>> {
  if (!structuredData || !structuredData.transactions || structuredData.transactions.length === 0) {
    return [["No financial transaction data could be extracted from the document."]];
  }

  const { header, transactions, footer } = structuredData;
  const excelData: Array<Array<string | number | null>> = [];

  // Add header section if available
  if (header) {
    if (header.bankName) {
      excelData.push(['Bank Name:', header.bankName]);
    }
    if (header.accountNumber) {
      excelData.push(['Account Number:', header.accountNumber]);
    }
    if (header.accountHolderName) {
      excelData.push(['Account Holder:', header.accountHolderName]);
    }
    if (header.statementPeriod) {
      excelData.push(['Statement Period:', header.statementPeriod]);
    }
    if (header.statementDate) {
      excelData.push(['Statement Date:', header.statementDate]);
    }
    if (header.openingBalance !== undefined && header.openingBalance !== null) {
      excelData.push(['Opening Balance:', header.openingBalance]);
    }
    // Add empty row after header
    excelData.push([]);
  }

  // Transaction table headers
  const transactionHeaders = ['Date', 'Description', 'Paid Out', 'Paid In', 'Balance'];
  excelData.push(transactionHeaders);

  // Transaction rows - preserve number types for proper Excel formatting
  const dataRows = transactions.map(t => [
    t.date || '',
    t.description || '',
    t.debit !== undefined && t.debit !== null ? t.debit : null,
    t.credit !== undefined && t.credit !== null ? t.credit : null,
    t.balance !== undefined && t.balance !== null ? t.balance : null,
  ]);
  excelData.push(...dataRows);

  if (excelData.length === (header ? 7 : 1)) { // Only headers are present (header section + empty row + table header)
     return [["No financial transaction data could be extracted from the document."]];
  }

  // Add empty row before footer
  if (footer) {
    excelData.push([]);
  }

  // Add footer section if available
  if (footer) {
    if (footer.closingBalance !== undefined && footer.closingBalance !== null) {
      excelData.push(['Closing Balance:', footer.closingBalance]);
    }
    if (footer.totalDebits !== undefined && footer.totalDebits !== null) {
      excelData.push(['Total Debits:', footer.totalDebits]);
    }
    if (footer.totalCredits !== undefined && footer.totalCredits !== null) {
      excelData.push(['Total Credits:', footer.totalCredits]);
    }
    if (footer.totalWithdrawals !== undefined && footer.totalWithdrawals !== null) {
      excelData.push(['Total Withdrawals:', footer.totalWithdrawals]);
    }
    if (footer.totalDeposits !== undefined && footer.totalDeposits !== null) {
      excelData.push(['Total Deposits:', footer.totalDeposits]);
    }
    if (footer.summary) {
      excelData.push(['Summary:', footer.summary]);
    }
  }

  // Validate data and accuracy
  const validation = validateTransactionData(transactions, footer);
  if (!validation.isValid && validation.issues.length > 0) {
    console.warn("Data validation issues:", validation.issues);
  }
  if (validation.accuracyWarnings.length > 0) {
    console.warn("Accuracy warnings (totals may not match PDF):", validation.accuracyWarnings);
  }

  return excelData;
}


/**
 * @deprecated This function is too simplistic for complex PDF layouts. 
 * Use AI-driven structuring (structurePdfDataFlow) and formatStructuredDataForExcel instead.
 */
export function parseTextToTableData(text: string): string[][] {
  console.warn("parseTextToTableData is deprecated. Use AI-driven structuring.");
  if (!text) return [];

  const lines = text.split('\n').filter(line => line.trim() !== '');
  const table: string[][] = [];

  for (const line of lines) {
    const normalizedLine = line.replace(/\t/g, '    '); 
    const cells = normalizedLine.split(/ {2,}/).map(cell => cell.trim()).filter(cell => cell !== '');
    
    if (cells.length > 0) { 
      table.push(cells);
    }
  }
  
  if (table.every(row => row.length === 1) && table.length > 1) {
    const reprocessedTable: string[][] = [];
    for (const line of lines) {
        const cells = line.split(/\s+/).map(cell => cell.trim()).filter(cell => cell !== '');
        if (cells.length > 0) {
            reprocessedTable.push(cells);
        }
    }
    if(reprocessedTable.length > 0 && !reprocessedTable.every(row => row.length === 1)) {
        return reprocessedTable;
    }
  }

  return table.length > 0 ? table : [[text]]; 
}

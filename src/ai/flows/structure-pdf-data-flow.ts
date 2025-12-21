
'use server';
/**
 * @fileOverview Analyzes raw PDF text from bank statements and extracts a structured list of transactions.
 *
 * - structurePdfData - A function that processes text to extract bank statement transactions.
 * - StructurePdfDataInput - The input type for the structurePdfData function.
 * - StructuredPdfDataOutput - The return type for the structurePdfData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';


const TransactionSchema = z.object({
  date: z.string().describe("The date of the transaction. IMPORTANT: You must format this as YYYY-MM-DD. You MUST infer the correct year from the statement context and use that specific year (e.g., 2023, 2024). Do not literally output 'YYYY'."),
  description: z.string().describe("The full description, narration, or particulars of the transaction."),
  debit: z.number().optional().describe("The withdrawal amount (money out), as a positive number. Extract with EXACT precision - preserve all decimal places."),
  credit: z.number().optional().describe("The deposit amount (money in), as a positive number. This is a critical field to find. Extract with EXACT precision - preserve all decimal places."),
  balance: z.number().nullable().describe("CRITICAL: The running balance after the transaction. If a balance value is not present for a transaction row, you MUST output null for this field. The 'balance' key must always be present in the output for every transaction. Extract with EXACT precision - preserve all decimal places."),
}).describe("A single transaction line item.");
export type Transaction = z.infer<typeof TransactionSchema>;

const HeaderSchema = z.object({
  bankName: z.string().optional().describe("The name of the bank or financial institution."),
  accountNumber: z.string().optional().describe("The account number or account identifier."),
  accountHolderName: z.string().optional().describe("The name of the account holder."),
  statementPeriod: z.string().optional().describe("The statement period (e.g., 'Feb 1, 2024 - Feb 29, 2024')."),
  statementDate: z.string().optional().describe("The statement date if available."),
  openingBalance: z.number().optional().describe("The opening balance at the start of the statement period."),
}).describe("Header information from the bank statement.");

const FooterSchema = z.object({
  closingBalance: z.number().optional().describe("The closing balance at the end of the statement period."),
  totalDebits: z.number().optional().describe("Total of all debit transactions. Extract with EXACT precision."),
  totalCredits: z.number().optional().describe("Total of all credit transactions. Extract with EXACT precision."),
  totalWithdrawals: z.number().optional().describe("Total withdrawals if shown separately."),
  totalDeposits: z.number().optional().describe("Total deposits if shown separately."),
  summary: z.string().optional().describe("Any summary text or notes from the footer."),
}).describe("Footer information from the bank statement.");

const StructuredPdfDataOutputSchema = z.object({
  header: HeaderSchema.optional().describe("Header information extracted from the statement (bank name, account details, statement period, etc.)."),
  transactions: z.array(TransactionSchema).describe("An array of ALL financial transactions found on the statement across ALL pages. You MUST extract every single transaction without missing any."),
  footer: FooterSchema.optional().describe("Footer information extracted from the statement (totals, closing balance, summary, etc.)."),
});
export type StructuredPdfDataOutput = z.infer<typeof StructuredPdfDataOutputSchema>;


const StructurePdfDataInputSchema = z.object({
  rawText: z.string().describe("The raw text extracted from the PDF document, potentially including an OCR output."),
});
export type StructurePdfDataInput = z.infer<typeof StructurePdfDataInputSchema>;


export async function structurePdfData(input: StructurePdfDataInput): Promise<StructuredPdfDataOutput> {
  // Note: AbortSignal cannot be passed to server actions in Next.js
  // Cancellation should be checked on the client side before calling this function
  return structurePdfDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractBankStatementTransactionsPrompt',
  input: {schema: StructurePdfDataInputSchema},
  output: {schema: StructuredPdfDataOutputSchema},
  prompt: `You are an expert financial data extraction AI. Your task is to analyze raw text from a bank statement and extract ALL information including headers, transactions, and footers into a structured JSON format.

**CRITICAL RULES FOR ACCURACY:**

1.  **EXACT NUMBER PRECISION:** You MUST extract all monetary values with EXACT precision. If the PDF shows "1,234.56", extract exactly 1234.56 (not 1234.5 or 1234.560). Preserve all decimal places exactly as shown. This is critical for 99%+ accuracy.

2.  **PROCESS ALL PAGES THOROUGHLY:** The provided text may come from multiple pages. You MUST:
    - Process every single page from start to finish
    - Extract ALL transactions from every page - do not skip any
    - Handle page breaks correctly - transactions may span across pages
    - Ensure no transactions are merged or misplaced
    - Maintain transaction continuity across pages

3.  **EXTRACT HEADER INFORMATION:** Extract header metadata including:
    - Bank name or financial institution name
    - Account number or account identifier
    - Account holder name
    - Statement period (e.g., "Feb 1, 2024 - Feb 29, 2024")
    - Statement date if available
    - Opening balance if shown in header

4.  **EXTRACT FOOTER INFORMATION:** Extract footer metadata including:
    - Closing balance
    - Total debits/withdrawals
    - Total credits/deposits
    - Any summary text or notes
    - All totals with EXACT precision

5.  **COLUMN DETECTION AND MAPPING (CRITICAL):** Bank statements use different column names. You MUST correctly identify and map columns:
    - **Date column:** Look for "Date", "Transaction Date", "Posting Date", etc.
    - **Description column:** Look for "Description", "Narration", "Particulars", "Details", "Memo", etc.
    - **Debit column (money out):** Look for "Withdrawals", "Payments", "Money Out", "Debit", "Charges", "Paid Out", "Out", etc.
    - **Credit column (money in):** Look for "Deposits", "Receipts", "Money In", "Credit", "Paid In", "In", etc.
    - **Balance column:** Look for "Balance", "Running Balance", "Available Balance", etc.
    
    **IMPORTANT:** The column order in the PDF may differ from the standard order. You must correctly identify which column is which based on the header row, not by position. Map data to the correct fields regardless of PDF column order.

6.  **EXTRACT ALL TRANSACTIONS:** For every single transaction row:
    - Extract 'date' (format as YYYY-MM-DD, infer year from statement period)
    - Extract 'description' (full text, preserve exactly as shown)
    - Extract 'debit' if present (as positive number with exact precision)
    - Extract 'credit' if present (as positive number with exact precision)
    - Extract 'balance' (CRITICAL - must be present for every transaction, use null if genuinely missing)
    - Do NOT merge multiple transactions into one row
    - Do NOT skip any transactions

7.  **YEAR INFERENCE AND DATE FORMATTING:** 
    - Find the statement period or year from header (e.g., 'Statement Period: Feb 1, 2024 - Feb 29, 2024')
    - Apply the correct year to ALL transaction dates
    - Format all dates as YYYY-MM-DD (e.g., "2024-02-05", NOT "YYYY-MM-DD" or "2024-2-5")

8.  **VALIDATION AND COMPLETENESS:**
    - Verify that extracted totals match footer totals (if available)
    - Ensure no date gaps suggest missing transactions
    - Check that balance calculations are consistent
    - Report any discrepancies in the footer totals

9.  **CLEAN DATA:**
    - Each transaction is a single, distinct row - do not merge lines
    - Do not include "Balance brought forward" or similar summary lines as transactions
    - Preserve exact text for descriptions (do not truncate or modify)

**EXAMPLE:**

**Input Text Snippet:**
\`\`\`
ABC Bank
Account Number: 1234567890
Account Holder: John Doe
Statement Period: Feb 1, 2024 - Feb 29, 2024

Date Narration Withdrawals Deposits Balance
1 Feb Balance brought forward 40,000.00
3 Feb Card payment - High St Petrol 24.50 39,975.50
4 Feb Direct debit - Green Mobile 20.00 39,955.50
5 Feb Salary - Acme Corp 5,000.00 44,955.50

Total Withdrawals: 44.50
Total Deposits: 5,000.00
Closing Balance: 44,955.50
\`\`\`

**Correct JSON Output:**
\`\`\`json
{
  "header": {
    "bankName": "ABC Bank",
    "accountNumber": "1234567890",
    "accountHolderName": "John Doe",
    "statementPeriod": "Feb 1, 2024 - Feb 29, 2024",
    "openingBalance": 40000.00
  },
  "transactions": [
    { "date": "2024-02-03", "description": "Card payment - High St Petrol", "debit": 24.50, "balance": 39975.50 },
    { "date": "2024-02-04", "description": "Direct debit - Green Mobile", "debit": 20.00, "balance": 39955.50 },
    { "date": "2024-02-05", "description": "Salary - Acme Corp", "credit": 5000.00, "balance": 44955.50 }
  ],
  "footer": {
    "totalDebits": 44.50,
    "totalCredits": 5000.00,
    "closingBalance": 44955.50
  }
}
\`\`\`

Now, process the following full text and provide the structured JSON with headers, ALL transactions, and footers.

**Input Text:**
{{{rawText}}}
`,
});

const structurePdfDataFlow = ai.defineFlow(
  {
    name: 'structurePdfDataFlow',
    inputSchema: StructurePdfDataInputSchema,
    outputSchema: StructuredPdfDataOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);

    if (!output) {
      throw new Error("AI failed to structure transaction data. Output was null.");
    }
    
    // Safety check and data cleansing
    if (!output.transactions || !Array.isArray(output.transactions)) {
        console.warn("AI output was missing 'transactions' array. Returning empty list.");
        return { 
          header: output.header,
          transactions: [],
          footer: output.footer
        };
    }

    // Filter out any invalid or incomplete transaction entries returned by the AI.
    // A valid transaction must have a non-empty date and description.
    const cleanedTransactions = output.transactions.filter(t => {
        const hasDate = t.date && typeof t.date === 'string' && t.date.trim() !== '';
        const hasDescription = t.description && typeof t.description === 'string' && t.description.trim() !== '';
        return hasDate && hasDescription;
    });

    return { 
      header: output.header,
      transactions: cleanedTransactions,
      footer: output.footer
    };
  }
);

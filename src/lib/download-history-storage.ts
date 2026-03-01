/**
 * Browser storage for recently downloaded conversion files (Documents page).
 * Uses the same key and shape as the documents page so files appear there.
 */

import * as XLSX from 'xlsx';

export const DOWNLOAD_HISTORY_STORAGE_KEY = 'XLSCONVERT_DOWNLOADED_FILES';
export const MAX_FILE_COUNT = 12;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export interface StoredExcelFile {
  name: string;
  data: Array<Array<string | number | null>>;
  timestamp: number;
}

function normalizeCell(value: unknown): string | number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') return value;
  return String(value);
}

/**
 * Fetches CSV from url, parses it to a 2D array, and appends to localStorage.
 * File name will be baseFileName with .pdf/.csv replaced by .xlsx for display.
 * Returns true if saved, false on fetch/parse error (caller can still trigger download).
 */
export async function addToDownloadHistory(csvUrl: string, baseFileName: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const res = await fetch(csvUrl);
    if (!res.ok) return false;
    const csvText = await res.text();
    const workbook = XLSX.read(csvText, { type: 'string', raw: true });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) return false;
    const rows = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1, defval: null });
    const data: Array<Array<string | number | null>> = rows.map((row) =>
      Array.isArray(row) ? row.map(normalizeCell) : []
    );
    if (data.length === 0) return false;

    const storedData = localStorage.getItem(DOWNLOAD_HISTORY_STORAGE_KEY);
    let files: StoredExcelFile[] = storedData ? JSON.parse(storedData) : [];
    const now = Date.now();
    files = files.filter((f) => now - f.timestamp < TWENTY_FOUR_HOURS_MS);

    const displayName = baseFileName.replace(/\.pdf$/i, '').replace(/\.csv$/i, '') + '.xlsx';
    const newFile: StoredExcelFile = { name: displayName, data, timestamp: now };
    files.unshift(newFile);
    if (files.length > MAX_FILE_COUNT) files.length = MAX_FILE_COUNT;

    localStorage.setItem(DOWNLOAD_HISTORY_STORAGE_KEY, JSON.stringify(files));
    return true;
  } catch {
    return false;
  }
}

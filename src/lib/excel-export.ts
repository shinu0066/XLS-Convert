
import * as XLSX from 'xlsx';

/**
 * Validates data structure before Excel export to prevent errors
 */
function validateDataBeforeExport(data: Array<Array<string | number | null>>): { isValid: boolean; error?: string } {
  if (!data || data.length === 0) {
    return { isValid: false, error: "No data to export" };
  }

  // Check for invalid cell values that could cause Excel errors
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    if (!Array.isArray(row)) {
      return { isValid: false, error: `Row ${rowIndex + 1} is not an array` };
    }
    
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cell = row[colIndex];
      // Allow null, string, or number - reject other types
      if (cell !== null && typeof cell !== 'string' && typeof cell !== 'number' && cell !== undefined) {
        return { isValid: false, error: `Invalid cell type at row ${rowIndex + 1}, column ${colIndex + 1}` };
      }
    }
  }

  return { isValid: true };
}

/**
 * Finds the transaction table section in the data (after header, before footer)
 */
function findTransactionTableBounds(data: Array<Array<string | number | null>>): { startRow: number; endRow: number; headerRow: number } {
  // Find the transaction header row (Date, Description, Paid Out, Paid In, Balance)
  let headerRow = -1;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (Array.isArray(row) && row.length >= 5) {
      const firstCell = String(row[0] || '').toLowerCase();
      if (firstCell === 'date') {
        headerRow = i;
        break;
      }
    }
  }

  if (headerRow === -1) {
    // Fallback: assume first row is header if data looks like transactions
    return { startRow: 0, endRow: data.length - 1, headerRow: 0 };
  }

  // Find where transactions end (empty row or footer section)
  let endRow = data.length - 1;
  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    // Check if this is an empty row or starts with footer-like labels
    if (Array.isArray(row) && row.length > 0) {
      const firstCell = String(row[0] || '').toLowerCase();
      if (firstCell === '' || 
          firstCell === 'closing balance' || 
          firstCell === 'total debits' || 
          firstCell === 'total credits' ||
          firstCell === 'summary') {
        endRow = i - 1;
        break;
      }
    }
  }

  return { startRow: headerRow, endRow, headerRow };
}

/**
 * Exports data to Excel with proper formatting, cell types, and styles
 */
export function exportToExcel(data: Array<Array<string | number | null>>, fileName: string = 'converted_data.xlsx'): void {
  // Validate data structure
  const validation = validateDataBeforeExport(data);
  if (!validation.isValid) {
    console.error("Data validation failed:", validation.error);
    throw new Error(validation.error || "Invalid data structure");
  }

  // Create worksheet from data
  // Note: aoa_to_sheet creates independent cells (no merged cells) which prevents issue #4
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Explicitly ensure no merged cells exist (prevent multi-page PDF merging issues)
  if (worksheet['!merges']) {
    worksheet['!merges'] = [];
  }

  // Find transaction table bounds for formatting
  const tableBounds = findTransactionTableBounds(data);

  // Apply cell formatting and types
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      
      if (!cell) continue;

      // Determine if this is in the transaction table
      const isInTransactionTable = row >= tableBounds.startRow && row <= tableBounds.endRow;
      const isHeaderRow = row === tableBounds.headerRow;
      const isNumericColumn = isInTransactionTable && (col === 2 || col === 3 || col === 4); // Paid Out, Paid In, Balance
      const isDateColumn = isInTransactionTable && col === 0 && !isHeaderRow; // Date column (not header)
      const isDescriptionColumn = isInTransactionTable && col === 1; // Description

      // Set cell type and format
      if (isNumericColumn && !isHeaderRow && typeof cell.v === 'number') {
        // Format as number with 2 decimal places and thousands separator
        cell.z = '#,##0.00';
        cell.t = 'n'; // number type
      } else if (isDateColumn && typeof cell.v === 'string' && cell.v.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Format as date (YYYY-MM-DD)
        // Convert string date to Excel date serial number
        const dateValue = new Date(cell.v + 'T00:00:00'); // Add time to avoid timezone issues
        if (!isNaN(dateValue.getTime())) {
          // Excel uses days since 1900-01-01, but JavaScript Date uses milliseconds since 1970-01-01
          // Use the date value directly - XLSX will handle the conversion
          cell.v = dateValue;
          cell.t = 'd'; // date type
          cell.z = 'yyyy-mm-dd';
        } else {
          // If date parsing fails, keep as string
          cell.t = 's';
        }
      } else if (typeof cell.v === 'number') {
        // Other numeric cells (like header/footer values)
        cell.z = '#,##0.00';
        cell.t = 'n';
      } else {
        // Text cells
        cell.t = 's'; // string type
      }

      // Note: xlsx library has limited style support
      // We focus on number formatting (cell.z) and cell types (cell.t) which are well-supported
      // Styling (cell.s) may not work in all Excel versions, so we prioritize formatting
    }
  }

  // Set column widths dynamically
  const colWidths: Array<{ wch: number }> = [];
  const maxCols = Math.max(...data.map(row => row.length));
  
  for (let col = 0; col < maxCols; col++) {
    let maxWidth = 10; // Minimum width
    
    for (let row = 0; row < data.length; row++) {
      if (data[row] && data[row][col] !== undefined && data[row][col] !== null) {
        const cellValue = String(data[row][col]);
        // Calculate width: length of content + some padding
        const cellWidth = Math.max(cellValue.length, maxWidth);
        maxWidth = Math.min(cellWidth + 2, 50); // Cap at 50 characters
      }
    }
    
    // Set specific widths for transaction table columns
    if (col === 0) maxWidth = Math.max(maxWidth, 12); // Date
    if (col === 1) maxWidth = Math.max(maxWidth, 40); // Description
    if (col === 2) maxWidth = Math.max(maxWidth, 15); // Paid Out
    if (col === 3) maxWidth = Math.max(maxWidth, 15); // Paid In
    if (col === 4) maxWidth = Math.max(maxWidth, 18); // Balance
    
    colWidths.push({ wch: maxWidth });
  }
  
  worksheet['!cols'] = colWidths;

  // Freeze header row if transaction table exists
  if (tableBounds.headerRow >= 0) {
    worksheet['!freeze'] = {
      xSplit: 0,
      ySplit: tableBounds.headerRow + 1,
      topLeftCell: XLSX.utils.encode_cell({ r: tableBounds.headerRow + 1, c: 0 }),
      activePane: 'bottomRight',
      state: 'frozen'
    };
    // Alternative approach using views
    worksheet['!views'] = [{
      state: 'frozen',
      xSplit: 0,
      ySplit: tableBounds.headerRow + 1,
      topLeftCell: XLSX.utils.encode_cell({ r: tableBounds.headerRow + 1, c: 0 }),
      activeCell: XLSX.utils.encode_cell({ r: tableBounds.headerRow + 1, c: 0 })
    }];
  }
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // Write file with proper options to prevent corruption
  // Use standard writeFile which handles formatting correctly
  try {
    XLSX.writeFile(workbook, fileName);
  } catch (error) {
    console.error("Error writing Excel file:", error);
    throw new Error(`Failed to export Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

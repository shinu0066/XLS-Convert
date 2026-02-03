import { memo, useMemo, useCallback } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface DataPreviewProps {
  data: Array<Array<string | number | null>> | null;
}

const PREVIEW_ROW_LIMIT = 100; // Limit preview rows to prevent rendering performance issues

const DataPreview = memo(function DataPreview({ data }: DataPreviewProps) {
  // Limit data to first 100 rows for preview performance
  const displayData = useMemo(() => {
    if (!data || data.length === 0) return null;
    return data.slice(0, PREVIEW_ROW_LIMIT);
  }, [data]);

  const maxColumns = useMemo(() => {
    if (!displayData) return 0;
    return Math.max(0, ...displayData.map(row => row.length));
  }, [displayData]);

  // Helper to format cell value for display
  const formatCellValue = useCallback((value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      // Format numbers with 2 decimal places if they look like currency
      return value.toFixed(2);
    }
    return String(value);
  }, []);

  if (!displayData || displayData.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No data to display.</p>;
  }

  const hasMoreRows = data && data.length > PREVIEW_ROW_LIMIT;

  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-md border shadow-md max-h-[500px]">
      <Table>
        <TableCaption>
          Preview of extracted data. Scroll horizontally if needed.
          {hasMoreRows && ` (Showing first ${PREVIEW_ROW_LIMIT} of ${data.length} rows)`}
        </TableCaption>
        <TableHeader>
          <TableRow>
            {Array.from({ length: maxColumns }).map((_, colIndex) => (
              <TableHead key={colIndex} className="font-semibold bg-muted/50">
                Column {colIndex + 1}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayData.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: maxColumns }).map((_, cellIndex) => (
                <TableCell key={cellIndex} className="min-w-[100px]">
                  {formatCellValue(row[cellIndex])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
});

export default DataPreview;

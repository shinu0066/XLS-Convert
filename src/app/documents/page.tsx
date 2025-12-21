
"use client";

import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/core/loading-spinner';
import { FileText, UploadCloud, Trash2, AlertCircle, FileSpreadsheet, Eye, Download, Combine } from 'lucide-react';
import { format } from 'date-fns';
import { exportToExcel } from '@/lib/excel-export';

const MAX_FILE_COUNT = 12;
const STORAGE_KEY = 'XLSCONVERT_DOWNLOADED_FILES';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

interface StoredExcelFile {
    name: string;
    data: Array<Array<string | number | null>>;
    timestamp: number;
}

// --- Main Component ---
export default function DocumentsPage() {
    const { currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [storedFiles, setStoredFiles] = useState<StoredExcelFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStoredFiles = useCallback(() => {
        setIsLoading(true);
        if (typeof window !== 'undefined') {
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                try {
                    const files: StoredExcelFile[] = JSON.parse(storedData);
                    const now = Date.now();
                    const recentFiles = files.filter(file => (now - file.timestamp) < TWENTY_FOUR_HOURS_MS);
                    
                    // Sort by most recent first
                    recentFiles.sort((a, b) => b.timestamp - a.timestamp);

                    setStoredFiles(recentFiles);

                    // Clean up expired files from localStorage
                    if (recentFiles.length !== files.length) {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentFiles));
                    }
                } catch (error) {
                    console.error("Error parsing stored files:", error);
                    localStorage.removeItem(STORAGE_KEY); // Clear corrupted data
                }
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        // This page is accessible to all users, so we don't redirect if not logged in.
        fetchStoredFiles();
    }, [fetchStoredFiles]);


    const handleDownload = (file: StoredExcelFile) => {
        try {
            exportToExcel(file.data, file.name);
            toast({ title: "Download Started", description: `Downloading ${file.name}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Download Error', description: 'Could not re-download the file.' });
        }
    };
    
    const handleClearHistory = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
            setStoredFiles([]);
            toast({ title: "History Cleared", description: "Your local download history has been cleared." });
        }
    };

    const handleCombineAndDownload = () => {
        if (storedFiles.length < 2) {
            toast({
                variant: 'destructive',
                title: 'Not enough files',
                description: 'You need at least two files to combine them.',
            });
            return;
        }

        try {
            let combinedData: Array<Array<string | number | null>> = [];
            let headerTaken = false;

            // Sort files from oldest to newest to combine them chronologically
            const filesToCombine = [...storedFiles].sort((a, b) => a.timestamp - b.timestamp);

            filesToCombine.forEach(file => {
                if (!file.data || file.data.length === 0) return;

                if (!headerTaken && file.data.length > 0) {
                    const headerRow = file.data[0];
                    if (Array.isArray(headerRow)) {
                      combinedData.push(headerRow.map(cell => String(cell ?? ''))); // Add header from the first valid file
                      headerTaken = true;
                    }
                }
                
                // Add data rows (skip header), only if they exist
                if (file.data.length > 1) {
                    const dataRows = file.data.slice(1).map(row => 
                      Array.isArray(row) ? row.map(cell => String(cell ?? '')) : []
                    );
                    combinedData.push(...dataRows);
                }
            });
            
            // The check should be if we have more than just a single header row,
            // or if we have no data at all (which shouldn't happen if headerTaken is true).
            if (!headerTaken || combinedData.length <= 1) {
                 toast({ variant: 'destructive', title: 'No Data to Combine', description: 'The stored files do not contain any data rows to combine.' });
                 return;
            }

            exportToExcel(combinedData, 'combined-documents.xlsx');
            toast({ title: 'Download Started', description: 'Downloading combined Excel file.' });

        } catch (error) {
            console.error("Error combining files:", error);
            toast({ variant: 'destructive', title: 'Combine Error', description: 'An error occurred while combining the files.' });
        }
    };
    
    const storagePercentage = (storedFiles.length / MAX_FILE_COUNT) * 100;

    return (
        <div className="space-y-8">
            <Card className="shadow-xl">
                <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <CardTitle className="text-3xl font-bold flex items-center"><FileText className="mr-3 text-primary" />Your Recent Documents</CardTitle>
                        <CardDescription className="mt-2">
                            This page lists the last {MAX_FILE_COUNT} Excel files you have downloaded in the last 24 hours. This data is stored only in your browser.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2 mt-4 sm:mt-0 flex-shrink-0">
                         <Button variant="outline" onClick={handleClearHistory} disabled={storedFiles.length === 0}>
                            <Trash2 className="mr-2 h-4 w-4"/> Clear History
                        </Button>
                        <Button onClick={handleCombineAndDownload} disabled={storedFiles.length < 2}>
                            <Combine className="mr-2 h-4 w-4"/> Combine & Download All
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Stored Files (Last 24 Hours)</CardTitle>
                    <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                        <span>{storedFiles.length} / {MAX_FILE_COUNT} files stored</span>
                        <span>{storagePercentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={storagePercentage} className="w-full mt-2" />
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <LoadingSpinner message="Fetching recent documents..." />
                    ) : storedFiles.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                            <FileSpreadsheet className="mx-auto h-12 w-12 mb-4" />
                            <p>You have no recently downloaded files.</p>
                            <p className="text-sm">Convert a PDF on the homepage to see it appear here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Filename</TableHead>
                                        <TableHead>Saved At</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {storedFiles.map((file, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium truncate max-w-xs">{file.name}</TableCell>
                                            <TableCell>{format(new Date(file.timestamp), 'PP p')}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => handleDownload(file)}
                                                >
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Download Again
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

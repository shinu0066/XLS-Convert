/**
 * AWS Lambda API Integration (all via Next.js proxy)
 */

interface UploadResponse {
  uploadUrl: string;
  s3Key: string;
  bucket: string;
}

interface DownloadResponse {
  status: 'READY' | 'PROCESSING' | 'NOT_FOUND' | 'FORBIDDEN' | 'ERROR';
  downloadUrl?: string;
  message?: string;
}

const MAX_RETRIES = 15;
const RETRY_DELAY_MS = 20000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const pdfKeyToCsv = (key: string) =>
  key.replace(/^uploads\//, 'processed/').replace(/\.pdf$/i, '.csv');

// Convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadPdfAndGetCsv(
  file: File,
  onProgress?: (step: string) => void
): Promise<string> {
  console.log('🚀 Starting PDF upload...');
  
  try {
    // Step 1: Get upload URL via proxy
    onProgress?.('Getting upload URL...');
    const uploadResponse = await fetch('/api/aws-proxy/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name }),
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to get upload URL: ${uploadResponse.status}`);
    }

    const { uploadUrl, s3Key, bucket }: UploadResponse = await uploadResponse.json();
    console.log('✅ Got upload URL');

    // Step 2: Convert file to base64
    onProgress?.('Preparing file...');
    const fileData = await fileToBase64(file);

    // Step 3: Upload to S3 via proxy
    onProgress?.('Uploading PDF...');
    const s3Response = await fetch('/api/aws-proxy/s3-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadUrl, fileData }),
    });

    if (!s3Response.ok) {
      throw new Error(`Upload failed: ${s3Response.status}`);
    }
    console.log('✅ PDF uploaded');

    // Step 4: Wait for CSV via proxy
    const csvKey = pdfKeyToCsv(s3Key);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      onProgress?.(`Processing PDF (${attempt}/${MAX_RETRIES})...`);
      
      const downloadResponse = await fetch('/api/aws-proxy/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket, key: csvKey }),
      });

      if (!downloadResponse.ok) {
        throw new Error(`Download failed: ${downloadResponse.status}`);
      }

      const data: DownloadResponse = await downloadResponse.json();

      if (data.status === 'READY') {
        console.log('✅ CSV ready!');
        return data.downloadUrl!;
      }

      if (data.status === 'FORBIDDEN' || data.status === 'ERROR') {
        throw new Error(data.message || 'Processing failed');
      }

      // NOT_FOUND or PROCESSING: CSV not ready yet, keep polling
      if (data.status === 'NOT_FOUND') {
        console.log(`⏳ CSV not ready yet (attempt ${attempt}/${MAX_RETRIES})`);
      }
      onProgress?.(
        `Waiting for conversion… (${attempt}/${MAX_RETRIES}, ~${RETRY_DELAY_MS / 1000}s between checks)`
      );

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS);
      }
    }

    throw new Error('Timeout waiting for CSV');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export function triggerDownload(url: string, filename: string) {
  const csvFilename = filename.replace(/\.pdf$/i, '.csv');
  const link = document.createElement('a');
  link.href = url;
  link.download = csvFilename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

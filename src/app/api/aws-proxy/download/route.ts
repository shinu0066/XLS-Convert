import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

const DOWNLOAD_URL = process.env.NEXT_PUBLIC_DOWNLOAD_URL!;
const DOWNLOAD_KEY = process.env.NEXT_PUBLIC_DOWNLOAD_API_KEY!;

function httpsRequest(url: string, options: any, body?: string): Promise<{statusCode: number, data: string}> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode || 500, data });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bucket, key } = body;

    console.log('📥 Downloading:', key);

    const payload = JSON.stringify({
      apiKey: DOWNLOAD_KEY,
      bucket,
      key,
    });

    const response = await httpsRequest(DOWNLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, payload);

    // Parse the response data
    const data = JSON.parse(response.data);
    
    console.log('📦 Status:', data.status);

    // Always return 200 with the actual status in the body
    // Let the client handle NOT_FOUND, PROCESSING, READY, etc.
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Download error:', error);
    return NextResponse.json(
      { error: 'Failed to contact download service' },
      { status: 500 }
    );
  }
}
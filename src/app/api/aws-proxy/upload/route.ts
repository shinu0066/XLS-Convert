import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL!;
const UPLOAD_KEY = process.env.NEXT_PUBLIC_UPLOAD_API_KEY!;

function httpsRequest(url: string, options: any, body?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
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
    const { filename } = body;

    console.log('📤 Uploading:', filename);

    const payload = JSON.stringify({
      apiKey: UPLOAD_KEY,
      filename,
    });

    const data = await httpsRequest(UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, payload);

    console.log('✅ Upload URL received');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to get upload URL' },
      { status: 500 }
    );
  }
}
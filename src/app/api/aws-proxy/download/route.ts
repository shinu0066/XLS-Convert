import { NextRequest, NextResponse } from 'next/server';

const DOWNLOAD_URL = process.env.NEXT_PUBLIC_DOWNLOAD_URL!;
const DOWNLOAD_KEY = process.env.NEXT_PUBLIC_DOWNLOAD_API_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bucket, key } = body;

    console.log('📥 Downloading:', key);

    const response = await fetch(DOWNLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: DOWNLOAD_KEY,
        bucket,
        key,
      }),
    });

    const responseText = await response.text();
    let data: { status?: string; downloadUrl?: string; message?: string };
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = {};
    }

    // Lambda returns 404 when CSV is not ready yet (NOT_FOUND). Client expects 200 + body.status
    // so it can keep polling. Forward as 200 with the same body instead of 404.
    if (response.status === 404 && data.status === 'NOT_FOUND') {
      console.log('📦 Status: NOT_FOUND (still processing)');
      return NextResponse.json(data);
    }

    if (!response.ok) {
      console.error('❌ AWS Lambda error:', response.status, responseText);
      return NextResponse.json(
        { error: 'Failed to get download URL', ...data },
        { status: response.status }
      );
    }

    console.log('📦 Status:', data.status);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Download error:', error);
    return NextResponse.json(
      { error: 'Failed to contact download service' },
      { status: 500 }
    );
  }
}

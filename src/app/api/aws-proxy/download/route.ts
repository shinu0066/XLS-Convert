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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AWS Lambda error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get download URL' },
        { status: response.status }
      );
    }

    const data = await response.json();
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
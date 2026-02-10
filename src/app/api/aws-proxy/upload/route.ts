import { NextRequest, NextResponse } from 'next/server';

const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL!;
const UPLOAD_KEY = process.env.NEXT_PUBLIC_UPLOAD_API_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename } = body;

    console.log('📤 Uploading:', filename);

    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: UPLOAD_KEY,
        filename,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AWS Lambda error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get upload URL' },
        { status: response.status }
      );
    }

    const data = await response.json();
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
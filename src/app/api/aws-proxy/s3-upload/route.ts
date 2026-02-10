import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploadUrl, fileData } = body;

    console.log('📤 Proxy: Uploading to S3...');

    // Convert base64 back to binary
    const binaryData = Buffer.from(fileData, 'base64');

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/pdf',
      },
      body: binaryData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ S3 upload error:', errorText);
      return NextResponse.json(
        { error: 'S3 upload failed' },
        { status: response.status }
      );
    }

    console.log('✅ Proxy: S3 upload successful');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('💥 Proxy S3 upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
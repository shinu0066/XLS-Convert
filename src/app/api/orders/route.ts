// This file is no longer used by the subscription flow.
// It can be deleted if you are fully committed to subscriptions.
// For now, I will leave it empty to prevent any potential build errors.
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: "This endpoint is deprecated for subscriptions." }, { status: 410 });
}

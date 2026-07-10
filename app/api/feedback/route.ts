import { NextRequest, NextResponse } from 'next/server';
import { appendBoothRecord } from '@/lib/records';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = String(body?.sessionId || '').trim();
    const rating = Number(body?.rating);
    const comment = String(body?.comment || '').trim();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'rating must be between 1 and 5' }, { status: 400 });
    }

    await appendBoothRecord({
      type: 'feedback',
      sessionId,
      rating,
      comment
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'failed to save feedback' }, { status: 500 });
  }
}

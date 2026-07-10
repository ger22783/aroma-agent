import { NextRequest, NextResponse } from 'next/server';
import { listBoothRecords, sessionsToCsv, summarizeSessions } from '@/lib/records';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const format = url.searchParams.get('format');
    const records = await listBoothRecords(500);
    const sessions = summarizeSessions(records);

    if (format === 'csv') {
      return new NextResponse(sessionsToCsv(sessions), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="perfume-booth-records.csv"'
        }
      });
    }

    return NextResponse.json({
      ok: true,
      storage: 'database',
      sessions,
      records
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'failed to read records'
    }, { status: 500 });
  }
}

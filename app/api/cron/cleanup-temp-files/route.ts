import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-utils';
import { pruneExpiredTempFiles } from '@/lib/tempFiles';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (req: NextRequest) => {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('x-cron-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const deleted = await pruneExpiredTempFiles();
    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    console.error('[CRON cleanup-temp-files]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

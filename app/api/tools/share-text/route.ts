import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-utils';
import {
  MAX_SHARED_TEXT_CHARS,
  TEXT_SHARE_EXPIRY_OPTIONS,
} from '@/lib/textShareRules';
import {
  clientIp,
  checkTextShareLimit,
  createTextShare,
  pruneExpiredTextShares,
} from '@/lib/textShare';

export const POST = apiHandler(async (req: NextRequest) => {
  try {
    const { content, expiry } = await req.json();

    const option = TEXT_SHARE_EXPIRY_OPTIONS.find((o) => o.id === expiry);
    if (!option) {
      return NextResponse.json({ error: 'Invalid expiry option' }, { status: 400 });
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    if (content.length > MAX_SHARED_TEXT_CHARS) {
      return NextResponse.json(
        { error: `Text must be ${MAX_SHARED_TEXT_CHARS} characters or less` },
        { status: 400 }
      );
    }

    const ip = clientIp(req.headers);
    const { allowed, retryAfterMs } = await checkTextShareLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limited — one share per minute per IP', retryAfterMs },
        { status: 429 }
      );
    }

    await pruneExpiredTextShares();

    const result = await createTextShare(content.trim(), option.seconds, ip);

    return NextResponse.json(result);
  } catch (err) {
    console.error('[POST /api/tools/share-text]', err);
    return NextResponse.json({ error: 'Failed to share text' }, { status: 500 });
  }
});

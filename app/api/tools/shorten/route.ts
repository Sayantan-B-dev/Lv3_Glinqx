import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { generateShortCode } from '@/lib/shortCode';
import { apiHandler } from '@/lib/api-utils';
import { rateLimit } from '@/lib/rate-limit';

const SHORT_CODE_PATTERN = /\/s\/[a-zA-Z0-9]+/;

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
}

export const POST = apiHandler(async (req: NextRequest) => {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const appHost = new URL(appUrl).hostname;
    try {
      const inputHost = new URL(url).hostname;
      if (inputHost === appHost && SHORT_CODE_PATTERN.test(new URL(url).pathname)) {
        return NextResponse.json({ error: 'Cannot shorten a short link' }, { status: 400 });
      }
    } catch {}

    const session = await getSessionFromRequest(req);
    const ip = clientIp(req);

    // Rate limit: 10/min anonymous, 30/min logged-in
    const key = session ? `shorten:user:${session.user_id}` : `shorten:ip:${ip}`;
    const maxReqs = session ? 30 : 10;
    if (!rateLimit(key, maxReqs, 60_000)) {
      const remaining = session ? '30 per minute' : '10 per minute';
      return NextResponse.json({ error: `Rate limited — ${remaining}` }, { status: 429 });
    }

    // Clean up expired short links
    sql`DELETE FROM shortened_links WHERE created_at <= NOW() - INTERVAL '1 day'`.catch(() => {});

    const [existing] = await sql`
      SELECT short_code, created_at
      FROM shortened_links
      WHERE original_url = ${url} AND created_at > NOW() - INTERVAL '1 day'
      ORDER BY created_at DESC LIMIT 1
    `;
    if (existing) {
      return NextResponse.json({
        shortCode: existing.short_code,
        shortUrl: `${appUrl}/s/${existing.short_code}`,
        expiresAt: new Date(new Date(existing.created_at).getTime() + 86400000).toISOString(),
        serverTime: Date.now(),
      });
    }

    const [expired] = await sql`
      UPDATE shortened_links
      SET created_at = NOW(), click_count = 0
      WHERE original_url = ${url} AND created_at <= NOW() - INTERVAL '1 day'
      RETURNING short_code
    `;
    if (expired) {
      return NextResponse.json({
        shortCode: expired.short_code,
        shortUrl: `${appUrl}/s/${expired.short_code}`,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        serverTime: Date.now(),
      });
    }

    let shortCode = generateShortCode(6);
    const [dupe] = await sql`SELECT 1 FROM shortened_links WHERE short_code = ${shortCode}`;
    if (dupe) shortCode = generateShortCode(7);

    const [row] = await sql`
      INSERT INTO shortened_links (short_code, original_url, user_id)
      VALUES (${shortCode}, ${url}, ${session?.user_id ?? null})
      RETURNING short_code
    `;

    return NextResponse.json({
      shortCode: row.short_code,
      shortUrl: `${appUrl}/s/${row.short_code}`,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      serverTime: Date.now(),
    });
  } catch (err) {
    console.error('[POST /api/tools/shorten]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

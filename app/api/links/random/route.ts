import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  const excludeId = req.nextUrl.searchParams.get('exclude') || null;
  const limit = Math.min(20, parseInt(req.nextUrl.searchParams.get('limit') ?? '1'));
  const uid = session?.user_id ?? null;

  try {
    const rows = await sql`
      SELECT l.*, u.username, u.avatar_url,
             EXISTS (
               SELECT 1 FROM link_likes ll
               WHERE ll.link_id = l.id AND ll.user_id = ${uid}
             ) AS liked_by_user,
             EXISTS (
               SELECT 1 FROM saved_links sl
               WHERE sl.link_id = l.id AND sl.user_id = ${uid}
             ) AS bookmarked_by_user,
             (SELECT ARRAY_AGG(t.name) FROM link_tags lt JOIN tags t ON lt.tag_id = t.id WHERE lt.link_id = l.id) as tags
      FROM links l
      JOIN users u ON l.user_id = u.id
      WHERE l.visibility = 'public'
      AND ((${excludeId}::text) IS NULL OR l.id::text != (${excludeId}::text))
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;

    if (!rows.length) {
      const fallback = await sql`
        SELECT l.*, u.username, u.avatar_url,
               EXISTS (
                 SELECT 1 FROM link_likes ll
                 WHERE ll.link_id = l.id AND ll.user_id = ${uid}
               ) AS liked_by_user,
               EXISTS (
                 SELECT 1 FROM saved_links sl
                 WHERE sl.link_id = l.id AND sl.user_id = ${uid}
               ) AS bookmarked_by_user,
               (SELECT ARRAY_AGG(t.name) FROM link_tags lt JOIN tags t ON lt.tag_id = t.id WHERE lt.link_id = l.id) as tags
        FROM links l
        JOIN users u ON l.user_id = u.id
        WHERE l.visibility = 'public'
        ORDER BY RANDOM()
        LIMIT ${limit}
      `;

      if (!fallback.length) {
        return NextResponse.json({ error: 'No links found' }, { status: 404 });
      }
      return NextResponse.json({ links: fallback });
    }

    return NextResponse.json({ links: rows });
  } catch (err) {
    console.error('[Random API Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

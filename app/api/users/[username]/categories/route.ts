import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const GET = apiHandler(async (req: NextRequest, { params }: { params: { username: string } }) => {
  const { username } = params;
  const session = await getSessionFromRequest(req);
  const uid = session?.user_id ?? null;
  const topicType = req.nextUrl.searchParams.get('topicType');

  try {
    const conds: string[] = [];
    const p: any[] = [];
    let n = 0;

    conds.push(`LOWER(u.username) = $${n + 1}`);
    p.push(username.toLowerCase());
    n++;

    if (topicType) {
      conds.push(`l.topic_id IN (SELECT id FROM topics WHERE parent_id = (SELECT id FROM topics WHERE slug = $${n + 1}))`);
      p.push(topicType);
      n++;
    }

    conds.push(`(l.visibility = 'public'
      OR (l.visibility = 'followers' AND EXISTS (SELECT 1 FROM follows WHERE follower_id = $${n + 1} AND followee_id = l.user_id))
      OR (l.visibility = 'private' AND l.user_id = $${n + 1}))`);
    p.push(uid);

    const where = conds.join('\n    AND ');

    const rows = await query(
      `SELECT DISTINCT 
         CASE 
           WHEN l.original_url LIKE 'https://www.%' THEN SUBSTRING(l.original_url FROM 'https://www\.([^/]+)')
           ELSE SUBSTRING(l.original_url FROM 'https?://([^/]+)')
         END AS domain,
         COUNT(*)::int AS count
       FROM links l
       JOIN users u ON l.user_id = u.id
       WHERE ${where}
       GROUP BY domain
       ORDER BY count DESC`,
      p
    );

    return NextResponse.json({ categories: rows });
  } catch (err) {
    console.error('[GET /api/users/[username]/categories]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

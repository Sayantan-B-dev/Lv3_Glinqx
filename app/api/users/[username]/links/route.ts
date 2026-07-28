import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

const ORDER_MAP: Record<string, string> = {
  new: 'l.created_at DESC',
  oldest: 'l.created_at ASC',
  top: 'l.like_count DESC, l.created_at DESC',
};

export const GET = apiHandler(async (req: NextRequest, { params }: { params: { username: string } }) => {
  const { username } = params;
  const session = await getSessionFromRequest(req);
  const sp = req.nextUrl.searchParams;
  const sort = sp.get('sort') ?? 'new';
  const orderBy = ORDER_MAP[sort] || ORDER_MAP.new;
  const uid = session?.user_id ?? null;
  const page = Math.max(1, parseInt(sp.get('page') ?? '1'));
  const limit = Math.min(200, parseInt(sp.get('limit') ?? '30'));
  const offset = (page - 1) * limit;
  const domain = sp.get('domain');
  const topicType = sp.get('topicType');

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
    n++;

    if (domain) {
      conds.push(`(l.original_url LIKE $${n + 1} OR l.original_url LIKE $${n + 2})`);
      p.push(`%//${domain}%`, `%//%.${domain}%`);
      n += 2;
    }

    const where = conds.join('\n  AND ');

    const [countRow] = await query(
      `SELECT COUNT(*)::int AS count FROM links l JOIN users u ON l.user_id = u.id WHERE ${where}`,
      p
    );

    const dataParams = [...p, uid, limit, offset];
    const rows = await query(
      `SELECT l.id, l.title, l.description, l.original_url, l.short_code,
              l.preview_image, l.is_anonymous, l.like_count, l.visibility,
              EXISTS (SELECT 1 FROM link_likes ll WHERE ll.link_id = l.id AND ll.user_id = $${n + 1}) AS liked_by_user,
              l.comment_count, l.view_count, l.created_at,
              u.username, u.avatar_url,
              ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
       FROM links l
       JOIN users u ON l.user_id = u.id
       LEFT JOIN link_tags lt ON lt.link_id = l.id
       LEFT JOIN tags t ON t.id = lt.tag_id
       WHERE ${where}
       GROUP BY l.id, u.username, u.avatar_url
       ORDER BY ${orderBy}
       LIMIT $${n + 2} OFFSET $${n + 3}`,
      dataParams
    );

    return NextResponse.json({ links: rows, total: countRow?.count ?? 0, page, limit });
  } catch (err) {
    console.error('[GET /api/users/[username]/links]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const GET = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  const uid = session?.user_id ?? null;

  if (!session) {
    const rows = await sql`
      SELECT l.id, l.title, l.description, l.original_url, l.short_code,
             l.preview_image, l.is_anonymous, l.like_count, l.visibility,
             EXISTS (SELECT 1 FROM saved_links sl WHERE sl.link_id = l.id AND sl.user_id = ${uid}) AS bookmarked_by_user,
             l.comment_count, l.view_count, l.created_at,
             u.username, u.avatar_url,
             ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
      FROM links l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN link_tags lt ON lt.link_id = l.id
      LEFT JOIN tags t ON t.id = lt.tag_id
      WHERE l.visibility = 'public'
      GROUP BY l.id, u.username, u.avatar_url
      ORDER BY l.like_count DESC
      LIMIT 20
    `;
    return NextResponse.json({ links: rows });
  }

  const [user] = await sql`SELECT interests FROM users WHERE id = ${session.user_id}`;
  const interests: string[] = user?.interests ?? [];

  if (interests.length === 0) {
    const rows = await sql`
      SELECT l.id, l.title, l.description, l.original_url, l.short_code,
             l.preview_image, l.is_anonymous, l.like_count, l.visibility,
             EXISTS (SELECT 1 FROM saved_links sl WHERE sl.link_id = l.id AND sl.user_id = ${uid}) AS bookmarked_by_user,
             l.comment_count, l.view_count, l.created_at,
             u.username, u.avatar_url,
             ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
      FROM links l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN link_tags lt ON lt.link_id = l.id
      LEFT JOIN tags t ON t.id = lt.tag_id
      WHERE (l.visibility = 'public'
          OR (l.visibility = 'followers' AND EXISTS (SELECT 1 FROM follows WHERE follower_id = ${uid} AND followee_id = l.user_id))
          OR (l.visibility = 'private' AND l.user_id = ${uid}))
      GROUP BY l.id, u.username, u.avatar_url
      ORDER BY l.like_count DESC
      LIMIT 20
    `;
    return NextResponse.json({ links: rows });
  }

  const rows = await sql`
    SELECT l.id, l.title, l.description, l.original_url, l.short_code,
           l.preview_image, l.is_anonymous, l.like_count, l.visibility,
           EXISTS (SELECT 1 FROM saved_links sl WHERE sl.link_id = l.id AND sl.user_id = ${uid}) AS bookmarked_by_user,
           l.comment_count, l.view_count, l.created_at,
           u.username, u.avatar_url,
           ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags,
           COUNT(DISTINCT CASE WHEN t.normalized_name = ANY(${interests}) THEN t.id END) AS interest_match
    FROM links l
    JOIN users u ON l.user_id = u.id
    LEFT JOIN link_tags lt ON lt.link_id = l.id
    LEFT JOIN tags t ON t.id = lt.tag_id
    WHERE (l.visibility = 'public'
        OR (l.visibility = 'followers' AND EXISTS (SELECT 1 FROM follows WHERE follower_id = ${uid} AND followee_id = l.user_id))
        OR (l.visibility = 'private' AND l.user_id = ${uid}))
    GROUP BY l.id, u.username, u.avatar_url
    ORDER BY interest_match DESC, l.like_count DESC
    LIMIT 20
  `;

  return NextResponse.json({ links: rows });
});

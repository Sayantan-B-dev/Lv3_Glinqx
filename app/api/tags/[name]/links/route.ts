import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const GET = apiHandler(async (req: NextRequest, { params }: { params: { name: string } }) => {
  const session = await getSessionFromRequest(req);

  const rows = await sql`
    SELECT l.id, l.original_url, l.title, l.description, l.preview_image,
           l.like_count, l.comment_count, l.view_count, l.created_at,
           u.username, u.avatar_url,
           COALESCE(
             (SELECT json_agg(t.name) FROM link_tags lt JOIN tags t ON t.id = lt.tag_id WHERE lt.link_id = l.id),
             '[]'::json
           ) as tags,
           EXISTS(
             SELECT 1 FROM link_likes ll WHERE ll.link_id = l.id AND ll.user_id = ${session?.user_id ?? ''}
           ) as liked_by_user,
           EXISTS(
             SELECT 1 FROM saved_links sl WHERE sl.link_id = l.id AND sl.user_id = ${session?.user_id ?? ''}
           ) as bookmarked_by_user
    FROM links l
    JOIN users u ON u.id = l.user_id
    JOIN link_tags lt ON lt.link_id = l.id
    JOIN tags t ON t.id = lt.tag_id
    WHERE t.normalized_name = LOWER(TRIM(${params.name}))
    ORDER BY l.created_at DESC
  `;

  return NextResponse.json({ links: rows });
});
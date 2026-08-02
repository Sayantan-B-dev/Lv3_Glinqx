import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';
import { LIMITS } from '@/lib/limits';

// ── GET /api/links/[id] ─────────────────────────────────────
export const GET = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { id } = params;
  const session = await getSessionFromRequest(req);

  const rows = await sql`
    SELECT l.id, l.title, l.description, l.original_url, l.short_code,
           l.preview_image, l.is_anonymous, l.visibility,
           l.like_count, l.comment_count, l.view_count, l.click_count,
           EXISTS (
             SELECT 1 FROM link_likes ll
             WHERE ll.link_id = l.id AND ll.user_id = ${session?.user_id ?? null}
           ) AS liked_by_user,
           EXISTS (
             SELECT 1 FROM saved_links sl
             WHERE sl.link_id = l.id AND sl.user_id = ${session?.user_id ?? null}
           ) AS bookmarked_by_user,
           l.flagged_count, l.created_at, l.updated_at,
           u.username, u.avatar_url,
            ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags,
            t3.slug AS topic, t3.name AS topic_name, t3.color AS topic_color
    FROM links l
    JOIN users u ON l.user_id = u.id
    LEFT JOIN link_tags lt ON lt.link_id = l.id
    LEFT JOIN tags t ON t.id = lt.tag_id
    LEFT JOIN topics t3 ON l.topic_id = t3.id
    WHERE l.id = ${id}
    GROUP BY l.id, u.username, u.avatar_url, t3.slug, t3.name, t3.color
  `;

  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const link = rows[0];

  const uid = session?.user_id ?? null;
  const canView =
    link.visibility === 'public' ||
    (link.visibility === 'followers' && uid && (await sql`SELECT 1 FROM follows WHERE follower_id = ${uid} AND followee_id = ${link.user_id}`).length > 0) ||
    (link.visibility === 'private' && link.user_id === uid);

  if (!canView) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  sql`UPDATE links SET view_count = view_count + 1 WHERE id = ${id}`.catch(() => {});
  const referrer = req.headers.get('referer') ?? null;
  sql`INSERT INTO link_view_events (link_id, user_id, referrer) VALUES (${id}, ${session?.user_id ?? null}, ${referrer})`.catch(() => {});

  return NextResponse.json({ link });
});

// ── PATCH /api/links/[id] ───────────────────────────────────
export const PATCH = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, description, visibility, tags, topicId } = await req.json();
  const [link] = await sql`SELECT user_id FROM links WHERE id = ${params.id}`;
  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (link.user_id !== session.user_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (title !== undefined) {
    if (!String(title).trim()) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    }
    if (title.length > LIMITS.TITLE_MAX) {
      return NextResponse.json({ error: `Title must be ${LIMITS.TITLE_MAX} characters or fewer` }, { status: 400 });
    }
  }
  if (description !== undefined) {
    if (!String(description).trim()) {
      return NextResponse.json({ error: 'Description cannot be empty' }, { status: 400 });
    }
    if (description.length > LIMITS.DESC_MAX) {
      return NextResponse.json({ error: `Description must be ${LIMITS.DESC_MAX} characters or fewer` }, { status: 400 });
    }
  }
  if (topicId !== undefined && !topicId) {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
  }

  const [updated] = await sql`
    UPDATE links
    SET title = COALESCE(${title ?? null}, title),
        description = COALESCE(${description ?? null}, description),
        visibility = COALESCE(${visibility ?? null}, visibility),
        topic_id = COALESCE(${topicId ?? null}, topic_id),
        updated_at = NOW()
    WHERE id = ${params.id}
    RETURNING id, title, description, visibility, topic_id
  `;

  if (Array.isArray(tags)) {
    await sql`DELETE FROM link_tags WHERE link_id = ${params.id}`;

    for (const name of tags.slice(0, LIMITS.TAGS_MAX)) {
      const tagName = name.toLowerCase().replace(/^#/, '').trim();
      if (!tagName) continue;
      const [tag] = await sql`
        INSERT INTO tags (name, normalized_name, usage_count)
        VALUES (${tagName}, ${tagName}, 1)
        ON CONFLICT (normalized_name) DO NOTHING
        RETURNING id
      `;

      const tagId = tag?.id ?? (await sql`
        SELECT id FROM tags WHERE normalized_name = ${tagName} LIMIT 1
      `)[0]?.id;

      if (tagId) {
        await sql`INSERT INTO link_tags (link_id, tag_id) VALUES (${params.id}, ${tagId}) ON CONFLICT DO NOTHING`;
      }
    }
  }

  return NextResponse.json({ link: updated });
});

// ── DELETE /api/links/[id] ──────────────────────────────────
export const DELETE = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [link] = await sql`SELECT user_id FROM links WHERE id = ${params.id}`;
  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (link.user_id !== session.user_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await sql`DELETE FROM links WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
});

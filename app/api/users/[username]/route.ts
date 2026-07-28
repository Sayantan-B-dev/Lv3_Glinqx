import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

// GET /api/users/[username]
export const GET = apiHandler(async (req: NextRequest, { params }: { params: { username: string } }) => {
  const username = params.username.toLowerCase();

  const [user] = await sql`
    SELECT id, username, avatar_url, cover_url, bio, website, interests,
           streak, created_at,
           (google_id IS NOT NULL) as is_verified,
           (SELECT COUNT(*)::int FROM links WHERE user_id = users.id AND visibility = 'public') AS link_count,
           (SELECT COALESCE(SUM(like_count), 0)::int FROM links WHERE user_id = users.id AND visibility = 'public') AS like_count,
           (SELECT COUNT(*)::int FROM follows WHERE followee_id = users.id) AS follower_count,
           (SELECT COUNT(*)::int FROM follows WHERE follower_id = users.id) AS following_count
    FROM users
    WHERE LOWER(username) = ${username} AND is_banned = false
  `;

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Check relationships with current viewer
  const session = await getSessionFromRequest(req);
  let isFollowing = false;
  let isBlocked = false;
  if (session && session.user_id !== user.id) {
    const [f] = await sql`
      SELECT 1 FROM follows WHERE follower_id = ${session.user_id} AND followee_id = ${user.id}
    `;
    isFollowing = !!f;
    const [b] = await sql`
      SELECT 1 FROM blocks WHERE blocker_id = ${session.user_id} AND blocked_id = ${user.id}
    `;
    isBlocked = !!b;
  }

  return NextResponse.json({ user: { ...user, isFollowing, isBlocked } });
});
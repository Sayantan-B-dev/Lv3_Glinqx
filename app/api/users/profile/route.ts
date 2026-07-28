import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest, signToken, cookieOptions } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

// PATCH /api/users/profile
export const PATCH = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { username: rawUsername, bio, avatar_url, cover_url, website, interests } = await req.json();
    const username = rawUsername?.toLowerCase();

    if (rawUsername !== undefined) {
      if (!/^[a-z0-9_]{3,30}$/i.test(rawUsername)) {
        return NextResponse.json({ error: 'Username: 3–30 chars, letters/numbers/underscore' }, { status: 400 });
      }

      const existing = await sql`
        SELECT 1 FROM users
        WHERE username = ${username} AND id != ${session.user_id}
        LIMIT 1
      `;
      if (existing.length) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
    }

    const [user] = await sql`
      UPDATE users
      SET username = COALESCE(${username ?? null}, username),
          bio = ${bio ?? null},
          avatar_url = ${avatar_url ?? null},
          cover_url = ${cover_url ?? null},
          website = ${website ?? null},
          interests = ${interests ?? null}
      WHERE id = ${session.user_id}
      RETURNING id, username, email, avatar_url, cover_url, bio, website, interests, streak, role
    `;

    // Re-sign token with updated username
    const token = await signToken({ user_id: user.id, username: user.username, role: user.role });
    const res = NextResponse.json({ user });
    const opts = cookieOptions(req);
    res.cookies.set(opts.name, token, opts);

    return res;
  } catch (err) {
    console.error('[PATCH /api/users/profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
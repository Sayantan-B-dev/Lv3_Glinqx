import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const PUT = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { is_read } = await req.json();
  if (typeof is_read !== 'boolean') {
    return NextResponse.json({ error: 'is_read (boolean) required' }, { status: 400 });
  }

  const [notif] = await sql`
    UPDATE notifications SET is_read = ${is_read}
    WHERE id = ${params.id} AND user_id = ${session.user_id}
    RETURNING id
  `;

  if (!notif) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
});

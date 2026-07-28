import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { apiHandler } from '@/lib/api-utils';
import { toCategoryName, extractDomain } from '@/lib/domain';

export const GET = apiHandler(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams;
    const topic = sp.get('topic');
    const topicType = sp.get('topicType');

    const params: any[] = [];
    let topicFilter = '';
    if (topic) {
      params.push(topic);
      topicFilter = `AND l.topic_id = (SELECT id FROM topics WHERE slug = $1)`;
    } else if (topicType) {
      params.push(topicType);
      topicFilter = `AND l.topic_id IN (SELECT id FROM topics WHERE parent_id = (SELECT id FROM topics WHERE slug = $1))`;
    }

    const rows = await query(`
      SELECT l.original_url
      FROM links l
      WHERE l.visibility = 'public'
      ${topicFilter}
    `, params);

    const counts = new Map<string, number>();
    for (const r of rows) {
      const domain = extractDomain(r.original_url);
      const name = toCategoryName(domain);
      counts.set(name, (counts.get(name) || 0) + 1);
    }

    const categories = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 200);

    return NextResponse.json({ categories });
  } catch (err) {
    console.error('[GET /api/links/categories]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

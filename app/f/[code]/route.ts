import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import sql from '@/lib/db';
import { apiHandler } from '@/lib/api-utils';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp, destroyTempFileByCode } from '@/lib/tempFiles';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(
  async (req: NextRequest, { params }: { params: Promise<{ code: string }> }) => {
    const { code } = await params;
    const ip = clientIp(req);

    if (!rateLimit(`tf:hit:${ip}`, 30, 60_000)) {
      return new NextResponse('Not found', { status: 404 });
    }

    const [row] = await sql`
      SELECT public_id, file_name, size_bytes, mime_type, expires_at
      FROM temp_files WHERE code = ${code} LIMIT 1
    `;

    if (!row) {
      return new NextResponse('Not found', { status: 404 });
    }

    if (new Date(row.expires_at).getTime() <= Date.now()) {
      await destroyTempFileByCode(code);
      return new NextResponse('Not found', { status: 404 });
    }

    const fileUrl = cloudinary.url(row.public_id, {
      resource_type: 'raw',
      type: 'upload',
    });

    let upstream: Response;
    try {
      upstream = await fetch(fileUrl);
    } catch {
      return new NextResponse('Download failed', { status: 502 });
    }

    if (upstream.status === 404) {
      await destroyTempFileByCode(code);
      return new NextResponse('Not found', { status: 404 });
    }
    if (!upstream.ok) {
      return new NextResponse('Download failed', { status: 502 });
    }

    const bytes = Buffer.from(await upstream.arrayBuffer());
    const contentType =
      upstream.headers.get('content-type') ||
      row.mime_type ||
      'application/octet-stream';
    const disposition = `attachment; filename="${row.file_name}"; filename*=UTF-8''${encodeURIComponent(row.file_name)}`;

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Content-Length': String(row.size_bytes),
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }
);

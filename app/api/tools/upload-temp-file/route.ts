import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-utils';
import {
  MAX_TEMP_FILE_BYTES,
  isBlockedTempFile,
} from '@/lib/tempFileRules';
import {
  clientIp,
  checkTempUploadLimit,
  createTempFile,
  pruneExpiredTempFiles,
} from '@/lib/tempFiles';

const MULTIPART_OVERHEAD = 1024;

export const POST = apiHandler(async (req: NextRequest) => {
  try {
    const contentLength = Number(req.headers.get('content-length') ?? '0');
    if (contentLength > MAX_TEMP_FILE_BYTES + MULTIPART_OVERHEAD) {
      return NextResponse.json(
        { error: 'File must be 3MB or less' },
        { status: 413 }
      );
    }

    const ip = clientIp(req);
    const { allowed, retryAfterMs } = await checkTempUploadLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limited — one upload per minute per IP', retryAfterMs },
        { status: 429 }
      );
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_TEMP_FILE_BYTES) {
      return NextResponse.json(
        { error: 'File must be 3MB or less' },
        { status: 413 }
      );
    }

    const mime = file.type || 'application/octet-stream';
    if (isBlockedTempFile(file.name, mime)) {
      return NextResponse.json(
        {
          error:
            'This file type is blocked for security. Zip it and upload the .zip instead.',
        },
        { status: 400 }
      );
    }

    await pruneExpiredTempFiles();

    const result = await createTempFile(
      {
        name: file.name,
        mime,
        size: file.size,
        buffer: Buffer.from(await file.arrayBuffer()),
      },
      ip
    );

    return NextResponse.json({ ...result, serverTime: Date.now() });
  } catch (err) {
    console.error('[POST /api/tools/upload-temp-file]', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
});

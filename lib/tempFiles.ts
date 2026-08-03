import { NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import sql from '@/lib/db';
import { generateShortCode } from '@/lib/shortCode';
import { TEMP_UPLOAD_WINDOW_MS } from '@/lib/tempFileRules';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const TEMP_FILE_FOLDER = 'lnkzoo_temp';
export const TEMP_FILE_CODE_LENGTH = 10;

export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
}

export function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[\r\n\u0000-\u001f]/g, '')
    .replace(/[\\/:*?"<>|]/g, '_')
    .trim();
  return cleaned || 'file';
}

export async function checkTempUploadLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const [row] = await sql`
    SELECT last_upload_at FROM temp_file_limits WHERE ip = ${ip}
  `;
  if (!row) return { allowed: true, retryAfterMs: 0 };
  const elapsed = Date.now() - new Date(row.last_upload_at).getTime();
  if (elapsed >= TEMP_UPLOAD_WINDOW_MS) return { allowed: true, retryAfterMs: 0 };
  return { allowed: false, retryAfterMs: TEMP_UPLOAD_WINDOW_MS - elapsed };
}

export async function recordTempUpload(ip: string): Promise<void> {
  await sql`
    INSERT INTO temp_file_limits (ip, last_upload_at)
    VALUES (${ip}, NOW())
    ON CONFLICT (ip) DO UPDATE SET last_upload_at = NOW()
  `;
}

export async function pruneExpiredTempFiles(): Promise<number> {
  const rows = await sql`
    SELECT code, public_id FROM temp_files WHERE expires_at <= NOW()
  `;
  for (const row of rows) {
    await cloudinary.uploader
      .destroy(row.public_id, { resource_type: 'raw' })
      .catch(() => {});
    await sql`DELETE FROM temp_files WHERE code = ${row.code}`.catch(() => {});
  }
  return rows.length;
}

export async function destroyTempFileByCode(code: string): Promise<void> {
  const [row] = await sql`SELECT public_id FROM temp_files WHERE code = ${code}`;
  if (!row) return;
  await cloudinary.uploader
    .destroy(row.public_id, { resource_type: 'raw' })
    .catch(() => {});
  await sql`DELETE FROM temp_files WHERE code = ${code}`.catch(() => {});
}

export async function createTempFile(
  file: { name: string; mime: string; size: number; buffer: Buffer },
  ip: string
): Promise<{
  code: string;
  url: string;
  fileName: string;
  sizeBytes: number;
  expiresAt: string;
  nextUploadAt: string;
}> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const uploadResult = await cloudinary.uploader.upload(
    `data:${file.mime};base64,${file.buffer.toString('base64')}`,
    {
      resource_type: 'raw',
      folder: TEMP_FILE_FOLDER,
    }
  );

  const fileName = sanitizeFileName(file.name);
  const code = generateShortCode(TEMP_FILE_CODE_LENGTH);
  const nextUploadAt = new Date(Date.now() + TEMP_UPLOAD_WINDOW_MS);

  const [row] = await sql`
    INSERT INTO temp_files (id, code, public_id, file_name, size_bytes, mime_type, expires_at)
    VALUES (${code}, ${code}, ${uploadResult.public_id}, ${fileName}, ${file.size}, ${file.mime}, NOW() + INTERVAL '5 minutes')
    RETURNING expires_at
  `;

  await recordTempUpload(ip);

  return {
    code,
    url: `${appUrl}/f/${code}`,
    fileName,
    sizeBytes: file.size,
    expiresAt: new Date(row.expires_at).toISOString(),
    nextUploadAt: nextUploadAt.toISOString(),
  };
}

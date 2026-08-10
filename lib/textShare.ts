import sql from '@/lib/db';
import { generateShortCode } from '@/lib/shortCode';
import { TEXT_SHARE_WINDOW_MS } from '@/lib/textShareRules';

export const TEXT_SHARE_CODE_LENGTH = 10;

export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
}

export async function checkTextShareLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const [row] = await sql`
    SELECT last_share_at FROM shared_text_limits WHERE ip = ${ip}
  `;
  if (!row) return { allowed: true, retryAfterMs: 0 };
  const elapsed = Date.now() - new Date(row.last_share_at).getTime();
  if (elapsed >= TEXT_SHARE_WINDOW_MS) return { allowed: true, retryAfterMs: 0 };
  return { allowed: false, retryAfterMs: TEXT_SHARE_WINDOW_MS - elapsed };
}

export async function recordTextShare(ip: string): Promise<void> {
  await sql`
    INSERT INTO shared_text_limits (ip, last_share_at)
    VALUES (${ip}, NOW())
    ON CONFLICT (ip) DO UPDATE SET last_share_at = NOW()
  `;
}

export async function pruneExpiredTextShares(): Promise<number> {
  const rows = await sql`
    DELETE FROM shared_texts WHERE expires_at <= NOW()
    RETURNING id
  `;
  return rows.length;
}

export async function destroyTextShareByCode(code: string): Promise<void> {
  await sql`DELETE FROM shared_texts WHERE code = ${code}`.catch(() => {});
}

export async function createTextShare(
  content: string,
  ttlSeconds: number,
  ip: string
): Promise<{
  code: string;
  url: string;
  expiresAt: string;
  nextShareAt: string;
}> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const code = generateShortCode(TEXT_SHARE_CODE_LENGTH);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const nextShareAt = new Date(Date.now() + TEXT_SHARE_WINDOW_MS);

  const [row] = await sql`
    INSERT INTO shared_texts (id, code, content, expires_at)
    VALUES (${code}, ${code}, ${content}, ${expiresAt})
    RETURNING expires_at
  `;

  await recordTextShare(ip);

  return {
    code,
    url: `${appUrl}/t/${code}`,
    expiresAt: new Date(row.expires_at).toISOString(),
    nextShareAt: nextShareAt.toISOString(),
  };
}

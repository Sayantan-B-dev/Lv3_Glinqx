import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import sql from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp, destroyTextShareByCode } from '@/lib/textShare';
import CopyButton from './CopyButton';

export const dynamic = 'force-dynamic';

export default async function SharedTextPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const ip = clientIp(await headers());

  if (!rateLimit(`ts:hit:${ip}`, 30, 60_000)) {
    notFound();
  }

  const [row] = await sql`
    SELECT content, expires_at FROM shared_texts WHERE code = ${code} LIMIT 1
  `;

  if (!row) notFound();

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await destroyTextShareByCode(code);
    notFound();
  }

  const destroyedAt = new Date(row.expires_at).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="shared-text-page">
      <div className="shared-text-card">
        <h1 className="shared-text-heading">Shared Text</h1>
        <div className="shared-text-expiry">Destroyed at {destroyedAt}</div>
        <pre className="shared-text-content">{row.content}</pre>
        <div className="shared-text-actions">
          <CopyButton value={row.content} />
          <Link href="/" className="shared-text-home">LnkZoo Home</Link>
        </div>
      </div>
    </div>
  );
}

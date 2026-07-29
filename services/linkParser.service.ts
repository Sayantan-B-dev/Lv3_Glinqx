import { decodeHtmlEntities } from '@/lib/html';
import { fetchOEmbed, fallbackTitle } from '@/lib/platform';

export interface ParseResult {
  title: string;
  description: string;
  image: string;
  domain: string;
}

function buildMetaMap(html: string): Map<string, string> {
  const map = new Map<string, string>();
  const metaRegex = /<meta[\s>][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = metaRegex.exec(html)) !== null) {
    const tag = match[0];
    const key = tag.match(/(?:property|name)=(["'])(.*?)\1/i)?.[2];
    const val = tag.match(/content=(["'])(.*?)\1/i)?.[2];
    if (key && val) map.set(key.toLowerCase(), val);
  }
  return map;
}

function extractTitle(html: string): string {
  return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || '';
}

function extractJSONLD(html: string): { title?: string; description?: string } {
  const m = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return {};
  try {
    const ld = JSON.parse(m[1]);
    return { title: ld.name || ld.headline || ld.title, description: ld.description };
  } catch { return {}; }
}

function extractYouTube(html: string): { title?: string; description?: string } {
  const m = html.match(/ytInitialPlayerResponse\s*=\s*({.*?});/);
  if (!m) return {};
  try {
    const yt = JSON.parse(m[1]);
    return { title: yt.videoDetails?.title, description: yt.videoDetails?.shortDescription };
  } catch { return {}; }
}

export async function parseOGMetadata(url: string): Promise<ParseResult> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(6000),
      redirect: 'follow',
    });

    if (!res.ok) {
      return { title: fallbackTitle(url) || url, description: '', image: '', domain: new URL(url).hostname };
    }

    const text = await res.text();
    const html = text.slice(0, 150000);
    const meta = buildMetaMap(html);
    const domain = new URL(url).hostname;

    const get = (...keys: string[]) => {
      for (const k of keys) { const v = meta.get(k); if (v) return v; }
      return '';
    };

    let title = get('og:title', 'twitter:title') || extractTitle(html);
    let description = get('og:description', 'twitter:description', 'description');

    const rawImage = get('og:image', 'og:image:secure_url', 'twitter:image');
    const image = rawImage ? new URL(rawImage, url).href : '';

    if (!title) {
      const ld = extractJSONLD(html);
      title = ld.title || '';
      description = description || ld.description || '';
    }

    if (!title) {
      const yt = extractYouTube(html);
      title = yt.title || '';
      description = description || yt.description || '';
    }

    if (!title) {
      const oembed = await fetchOEmbed(url);
      if (oembed) {
        title = oembed.title;
        description = description || oembed.description || '';
      }
    }

    if (!title) title = fallbackTitle(url) || url;

    return {
      title: decodeHtmlEntities(title),
      description: description ? decodeHtmlEntities(description) : '',
      image,
      domain,
    };
  } catch {
    return { title: fallbackTitle(url) || url, description: '', image: '', domain: new URL(url).hostname };
  }
}

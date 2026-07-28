import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-utils';

export const POST = apiHandler(async (req: NextRequest) => {
  const { content } = await req.json();
  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const keys = [
    process.env.OPENROUTER_API_KEY_1,
    process.env.OPENROUTER_API_KEY_2,
    process.env.OPENROUTER_API_KEY_3,
  ].filter((k): k is string => !!k && k.startsWith('sk-or-'));

  if (keys.length === 0) {
    return NextResponse.json({ error: 'No valid API keys configured' }, { status: 500 });
  }

  const prompt = `You are a content analyzer. Given a description text, generate a concise title (max 10 words), a topic (one phrase, max 8 words), and 3-5 relevant tags.
Respond in strict JSON format: {"title":"...","topic":"...","tags":["...","...","..."]}. No markdown, no code blocks, just raw JSON.

Description:
${content.slice(0, 4000)}`;

  let attempts = 0;
  let keyIndex = 0;

  while (attempts < keys.length * 2) {
    attempts++;
    const key = keys[keyIndex];
    keyIndex = (keyIndex + 1) % keys.length;

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://lnkzoo.app',
          'X-Title': 'LnkZoo',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      if (res.status === 401 || res.status === 403) {
        continue;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error(`OpenRouter error ${res.status}: ${text.slice(0, 200)}`);
        continue;
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        const m = text.match(/\{[\s\S]*?"title"[\s\S]*?"topic"[\s\S]*?"tags"[\s\S]*?\}/);
        if (m) parsed = JSON.parse(m[0]);
        else continue;
      }

      if (parsed.title && parsed.topic && Array.isArray(parsed.tags)) {
        return NextResponse.json({
          title: parsed.title,
          topic: parsed.topic,
          tags: parsed.tags,
        });
      }
    } catch (err: any) {
      console.error('OpenRouter fetch error:', err.message);
      continue;
    }
  }

  return NextResponse.json({ error: 'All API keys exhausted or failed' }, { status: 502 });
});

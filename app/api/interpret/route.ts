import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const client = new Anthropic();

const SYSTEM_PROMPT = `You extract structured contact information from freeform text. The text may be in Norwegian or English.

Return ONLY valid JSON (no markdown, no code fences) with these fields:
- "name" (string) — full name
- "email" (string) — email address
- "address" (string) — street address
- "city" (string) — city name
- "country" (string) — one of: "no" (Norge/Norway), "se" (Sverige/Sweden), "dk" (Danmark/Denmark), "fi" (Finland), "other" (any other country), or "" if not mentioned
- "interests" (array of strings) — subset of: ["teknologi", "musikk", "sport", "reise"]. Map English equivalents: technology->teknologi, music->musikk, sport->sport, travel->reise
- "contact_method" (string) — one of: "email", "phone", "none", or "" if not mentioned
- "message" (string) — any remaining message content that doesn't fit the other fields

Use "" for string fields and [] for arrays when the information is not present in the text.`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { text } = body as { text?: string };

  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Missing or empty "text" field' }, { status: 400 });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text.trim() }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const cleaned = responseText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const data = JSON.parse(cleaned);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Interpret error:', err);
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Failed to parse AI response as JSON' }, { status: 500 });
    }
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 });
  }
}

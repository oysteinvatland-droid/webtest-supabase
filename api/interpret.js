const { readFileSync } = require('fs');
const { resolve } = require('path');
const Anthropic = require('@anthropic-ai/sdk');

// Load .env.local if ANTHROPIC_API_KEY is not already set
if (!process.env.ANTHROPIC_API_KEY) {
  try {
    const envPath = resolve(__dirname, '..', '.env.local');
    const lines = readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^(\w+)=(.*)$/);
      if (match) process.env[match[1]] = match[2];
    }
  } catch (_) {}
}

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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Missing or empty "text" field' });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text.trim() }],
    });

    const responseText = message.content[0].text;

    // Strip code fences if Claude adds them despite instructions
    const cleaned = responseText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    const data = JSON.parse(cleaned);
    return res.status(200).json(data);
  } catch (err) {
    console.error('Interpret error:', err.status, err.message, err.error);
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'Failed to parse AI response as JSON' });
    }
    return res.status(500).json({ error: 'AI request failed' });
  }
};

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A static HTML/vanilla JavaScript web app designed for Vercel deployment. It serves as a test interface for Playwright and Claude web plugins, demonstrating Supabase integration and AI-powered form filling.

Two pages:
- `index.html` — Contact form (writes to Supabase), plus a counter widget and modal for interaction testing
- `users.html` — Read-only listing of submitted contacts from Supabase

## Running the App

For local development with the API route (recommended):

```bash
npx vercel dev
```

This serves static files and the `/api/interpret` serverless function. Requires a `.env.local` file with:

```
ANTHROPIC_API_KEY=sk-ant-...
```

For static-only testing (no AI fill):

```bash
python3 -m http.server 8080
```

## AI Form Fill (Vercel Serverless)

The "AI Fyll" button in `index.html` sends the notes textarea content to `/api/interpret`, which calls the Claude API to extract structured contact data and auto-fills the form.

- **Serverless function:** `api/interpret.js` — POST endpoint, uses `@anthropic-ai/sdk`
- **Environment variable:** `ANTHROPIC_API_KEY` (set in Vercel dashboard or `.env.local` for local dev)
- **Model:** `claude-sonnet-4-20250514` for cost-efficient structured extraction

## Supabase Integration

Supabase is loaded via CDN (`@supabase/supabase-js@2`) and credentials are hardcoded directly in both HTML files:

```js
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

**Table: `contacts`** — columns: `name`, `email`, `address`, `city`, `country`, `interests` (array), `contact_method`, `message`, `created_at`

- `index.html` inserts rows via `sb.from('contacts').insert({...})`
- `users.html` reads rows via `sb.from('contacts').select('*').order('created_at', { ascending: false })`

Both files must be kept in sync if the Supabase client config changes.

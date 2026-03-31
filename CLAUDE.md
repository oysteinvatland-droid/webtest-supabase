# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 15 (App Router) web app deployed on Vercel. It serves as a test interface for Playwright and Claude web plugins, demonstrating Supabase integration and AI-powered form filling.

Two routes:
- `/` (`app/page.tsx`) — Contact form (writes to Supabase), plus a counter widget and modal for interaction testing
- `/users` (`app/users/page.tsx`) — Read-only listing of submitted contacts from Supabase

## Running the App

```bash
npm run dev
```

Starts the Next.js dev server (port 3000). Requires `.env.local` with:

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SONIOX_API_KEY=...
```

## Build & Deploy

```bash
npm run build   # production build
npm run start   # serve production build locally
```

`vercel.json` sets `"framework": "nextjs"`. The only server-side code is the API route; both pages are `"use client"` components.

## AI Form Fill (API Route)

The "AI Fyll" button sends the notes textarea content to `/api/interpret`, which calls the Claude API to extract structured contact data and auto-fills the form.

- **Route handler:** `app/api/interpret/route.ts` — POST endpoint, uses `@anthropic-ai/sdk`
- **Environment variable:** `ANTHROPIC_API_KEY` (server-side only, set in Vercel dashboard or `.env.local`)
- **Model:** `claude-sonnet-4-20250514` for cost-efficient structured extraction

## Speech-to-Text (Soniox)

The "Dikter" (dictate) button uses the Soniox real-time STT API loaded via dynamic ESM CDN import (`@soniox/speech-to-text-web`) with `/* webpackIgnore: true */`. The API key comes from `NEXT_PUBLIC_SONIOX_API_KEY`. It supports Norwegian (`no`) and English (`en`) with the `stt-rt-v4` model.

## Supabase Integration

Supabase client is created in `lib/supabase.ts` using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables.

**Table: `contacts`** — columns: `name`, `email`, `address`, `city`, `country`, `interests` (array), `contact_method`, `message`, `notes`, `created_at`

- `app/page.tsx` inserts rows via `supabase.from('contacts').insert({...})`
- `app/users/page.tsx` reads rows via `supabase.from('contacts').select('*').order('created_at', { ascending: false })`

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

## Styling

No Tailwind or CSS modules. All styling uses **styled-jsx** (`<style jsx>` blocks inside components). CSS variables are defined in `app/globals.css`. Dynamic styles (dark/light mode, theme colors) are passed as template literal values into the JSX style block. Shared components (`Nav`, `Footer`) accept `darkMode` and color props.

Font stack: **Cormorant Garamond** (headings, via Google Fonts) + **DM Sans** (body). Both imported in `app/layout.tsx`.

## AI Form Fill (API Route)

The "AI Auto-Fill" button sends the notes textarea content to `/api/interpret`, which calls the Claude API to extract structured contact data and auto-fills the form.

- **Route handler:** `app/api/interpret/route.ts` — POST endpoint, uses `@anthropic-ai/sdk`
- **Environment variable:** `ANTHROPIC_API_KEY` (server-side only, set in Vercel dashboard or `.env.local`)
- **Model:** `claude-sonnet-4-6` for cost-efficient structured extraction

## Speech-to-Text (Soniox)

The "Dikter" (dictate) button uses the Soniox real-time STT API loaded via dynamic ESM CDN import (`@soniox/speech-to-text-web`) with `/* webpackIgnore: true */`. The API key comes from `NEXT_PUBLIC_SONIOX_API_KEY`. It supports Norwegian (`no`) and English (`en`) with the `stt-rt-v4` model.

## Supabase Integration

Supabase client is created in `lib/supabase.ts` using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables.

**Table: `contacts`** — columns: `name`, `email`, `address`, `city`, `country`, `interests` (array), `contact_method`, `message`, `notes`, `created_at`

- `app/page.tsx` inserts rows via `supabase.from('contacts').insert({...})`
- `app/users/page.tsx` reads rows via `supabase.from('contacts').select('*').order('created_at', { ascending: false })`

## Playwright Testing

Playwright is installed (`pip install playwright`) with the Chromium headless shell binary. Test scripts are plain Python files in the project root (e.g., `test_design.py`). Screenshots are written to `/tmp/design-screenshots/` by convention. The dev server must be running on port 3000 before executing tests.

```bash
python test_design.py
```

## Skills

Anthropic Agent Skills are installed in `.claude/skills/`. Currently installed: `frontend-design`, `webapp-testing`, `pdf`, `docx`, `pptx`, `xlsx`, `claude-api`, `mcp-builder`, `canvas-design`, `algorithmic-art`, `brand-guidelines`, `theme-factory`, `web-artifacts-builder`, `doc-coauthoring`, `internal-comms`, `slack-gif-creator`, `skill-creator`. Invoke with `/<skill-name>`.

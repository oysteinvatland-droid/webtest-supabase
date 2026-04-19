# webtest-supabase

A Next.js 15 web app serving as a test interface for Playwright and Claude web plugins. Demonstrates Supabase integration, AI-powered form filling, and real-time speech-to-text.

## Routes

| Route | Description |
|---|---|
| `/` | Contact form with validation, AI auto-fill, voice dictation, counter widget, and modal |
| `/users` | Read-only card listing of all submitted contacts from Supabase |

## Getting Started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve production build
```

### Environment Variables

Create `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SONIOX_API_KEY=...
```

## Tech Stack

- **Framework:** Next.js 15 (App Router), deployed on Vercel
- **Database:** Supabase (`contacts` table)
- **Styling:** styled-jsx with CSS variables, Google Fonts (Cormorant Garamond + DM Sans)
- **AI:** Claude API (`claude-sonnet-4-6`) via `/api/interpret` for form auto-fill
- **Speech-to-Text:** Soniox real-time STT (Norwegian + English)
- **Testing:** Playwright (Python)

## Features

### AI Auto-Fill
Write or dictate freeform text in the Notes field, then click **AI Auto-Fill** — Claude extracts structured contact info (name, email, city, country, interests, etc.) and populates the form fields automatically.

### Voice Dictation
Click **Dictate** to start real-time speech recognition via Soniox. Supports Norwegian and English simultaneously.

### Playwright Testing
With the dev server running, execute:

```bash
python test_design.py
```

Screenshots are saved to `/tmp/design-screenshots/`.

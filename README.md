# AILA — Unified AI Life-Load Assistant

Multi-agent AI app for reducing mental load. Built for TCS Women's Day Hackathon.

## Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind
- **Agents**: LangGraph + Gemini 1.5 Flash
- **DB + Auth**: Supabase (PostgreSQL + pgvector)
- **Voice**: ElevenLabs TTS + Web Speech API STT
- **Calendar**: Google Calendar API + Microsoft Graph API
- **Deploy**: Vercel

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Fill in your keys (see .env.example for instructions)

# 3. Set up Supabase
# Run supabase/migrations/001_initial_schema.sql in Supabase SQL Editor

# 4. Run dev server
npm run dev
```

## Folder Structure

```
app/
  api/
    chat/route.ts              ← Multi-agent orchestration
    confirm-cooking/route.ts   ← Pantry deduction
    onboarding/route.ts        ← Sequential agent interview
    voice/speak/route.ts       ← ElevenLabs TTS
  page.tsx                     ← Landing (login)
  onboarding/page.tsx          ← Multi-agent onboarding
  chat/page.tsx                ← Main chat + dashboard
  layout.tsx

lib/
  agents/index.ts              ← EVA, MealAgent, TaskAgent, MisAgent
  calendar/index.ts            ← Google + Outlook abstraction
  hooks/useVoice.ts            ← STT + TTS hook
  mockData.ts                  ← All mock data (replace with Supabase calls)
  utils.ts                     ← PII scrubber, embeddings, memory search

types/index.ts                 ← All TypeScript types
supabase/migrations/           ← SQL schema
.env.example                   ← Environment variables guide
```

## Mock → Real

Every real API call is marked with `// REAL:` comments.
Every mock return is marked with `// MOCK:`.

To go live:
1. Replace `MOCK_*` imports in `lib/mockData.ts` with Supabase queries
2. Replace `callLLM()` mock in `lib/agents/index.ts` with actual Gemini calls
3. Replace `embedText()` mock in `lib/utils.ts` with Gemini embedding API
4. Add OAuth callbacks for Google + Outlook calendar
5. Enable Row Level Security in Supabase

## Agent Architecture

```
User Message → EVA (classifies) → MealAgent / TaskAgent / MisAgent
                                 ↓
                           Response + pendingAction?
                                 ↓
                    pgvector memory stored for next session
```

## Key Features
- Just Vent Mode — empathy-only responses
- Pantry intelligence loop — suggest → confirm → deduct → alert
- Adaptive learning via pgvector memory
- Calendar integration (Google + Outlook)
- MOM generation from meetings
- Burnout prediction
- Voice interaction (ElevenLabs + Web Speech API)
- Privacy mode per session
- PII scrubbing before every LLM call

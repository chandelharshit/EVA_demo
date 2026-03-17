// ================================================================
// AILA — MOCK → REAL MIGRATION GUIDE
// Every place you need to swap mock data for a real API call
// ================================================================

/*
HOW TO READ THIS FILE
─────────────────────
Each entry has:
  FILE     → which file to edit
  LINE     → what the mock currently does
  REAL     → what to replace it with
  PRIORITY → Day you should do this (from 8-day plan)
*/


// ════════════════════════════════════════════════════════════════
// PRIORITY 1 — Day 1 (Foundation)
// ════════════════════════════════════════════════════════════════

// FILE: lib/utils.ts → embedText()
// MOCK: returns random 768-dim vector
// REAL:
async function embedText_REAL(text: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] },
      }),
    }
  )
  const data = await response.json()
  return data.embedding.values  // 768-dim float array
}

// FILE: lib/utils.ts → searchMemories()
// MOCK: returns slice of MOCK_MEMORIES
// REAL:
async function searchMemories_REAL(query: string, userId: string, limit = 5) {
  const embedding = await embedText_REAL(query)
  const { data, error } = await supabase.rpc('match_memories', {
    query_embedding: embedding,
    match_user_id:   userId,
    match_count:     limit,
  })
  if (error) throw error
  return data
}

// FILE: lib/utils.ts → storeMemory()
// MOCK: console.log only
// REAL:
async function storeMemory_REAL(userId: string, agent: string, content: string, memoryType: string) {
  const embedding = await embedText_REAL(content)
  const { error } = await supabase.from('aila_memories').insert({
    user_id:     userId,
    agent,
    content,
    embedding,
    memory_type: memoryType,
  })
  if (error) throw error
}


// ════════════════════════════════════════════════════════════════
// PRIORITY 2 — Day 2-3 (Onboarding)
// ════════════════════════════════════════════════════════════════

// FILE: app/api/onboarding/route.ts
// MOCK: console.log saving data
// REAL: save extracted profile to correct Supabase table

async function saveOnboardingData_REAL(step: string, userId: string, extractedData: any) {
  const tableMap: Record<string, string> = {
    MEAL: 'user_health_profile',
    TASK: 'user_work_profile',
    MIS:  'user_notification_profile',
  }
  const table = tableMap[step]
  if (!table) return

  const { error } = await supabase
    .from(table)
    .upsert({ user_id: userId, ...extractedData })

  if (error) throw error

  // Advance onboarding step
  const nextStepMap: Record<string, string> = { MEAL: 'TASK', TASK: 'MIS', MIS: 'SUMMARY' }
  await supabase
    .from('users')
    .update({ onboarding_step: nextStepMap[step] ?? 'DONE' })
    .eq('id', userId)
}

// FILE: app/page.tsx → handleGoogleLogin()
// MOCK: setTimeout redirect
// REAL:
async function handleGoogleLogin_REAL() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'https://www.googleapis.com/auth/calendar.readonly',
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  // After OAuth callback, check user.onboarding_complete
  // → true:  redirect to /chat
  // → false: redirect to /onboarding
}


// ════════════════════════════════════════════════════════════════
// PRIORITY 3 — Day 3 (Core Chat)
// ════════════════════════════════════════════════════════════════

// FILE: lib/agents/index.ts → callLLM()
// MOCK: keyword-based canned responses
// REAL:
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages'

const llm = new ChatGoogleGenerativeAI({
  modelName: 'gemini-1.5-flash',
  apiKey: process.env.GOOGLE_GEMINI_API_KEY,
})

async function callLLM_REAL(systemPrompt: string, messages: any[]): Promise<string> {
  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    ...messages.map(m =>
      m.role === 'user'
        ? new HumanMessage(m.content)
        : new AIMessage(m.content)
    ),
  ])
  // Gemini returns content blocks — always extract safely
  const content = response.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) return content.map((b: any) => b.text ?? '').join('')
  return ''
}

// FILE: app/api/chat/route.ts → user context loading
// MOCK: imports from lib/mockData.ts
// REAL:
async function loadUserContext_REAL(userId: string) {
  const [
    { data: healthProfile  },
    { data: workProfile    },
    { data: notifProfile   },
    { data: pantry         },
    { data: likedMeals     },
  ] = await Promise.all([
    supabase.from('user_health_profile').select('*').eq('user_id', userId).single(),
    supabase.from('user_work_profile').select('*').eq('user_id', userId).single(),
    supabase.from('user_notification_profile').select('*').eq('user_id', userId).single(),
    supabase.from('pantry_items').select('*').eq('user_id', userId),
    supabase.from('meal_preferences').select('*').eq('user_id', userId),
  ])
  return { healthProfile, workProfile, notifProfile, pantry, likedMeals }
}


// ════════════════════════════════════════════════════════════════
// PRIORITY 4 — Day 4 (Pantry)
// ════════════════════════════════════════════════════════════════

// FILE: app/api/confirm-cooking/route.ts
// MOCK: spreads MOCK_PANTRY, updates in memory
// REAL:
async function confirmCooking_REAL(userId: string, meal: string, ingredientsToDeduct: any[]) {
  // Deduct each ingredient
  for (const { item, qty } of ingredientsToDeduct) {
    const { data: current } = await supabase
      .from('pantry_items')
      .select('quantity')
      .eq('user_id', userId)
      .eq('item_name', item)
      .single()

    if (current) {
      await supabase
        .from('pantry_items')
        .update({ quantity: Math.max(0, current.quantity - qty), last_updated: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('item_name', item)
    }
  }

  // Log meal history
  await supabase.from('meal_history').insert({
    user_id:             userId,
    meal_name:           meal,
    ingredients_used:    ingredientsToDeduct,
    was_suggested_by_ai: true,
    user_confirmed:      true,
  })
}

// FILE: lib/agents/index.ts → mealAgent() pantry extraction
// MOCK: hardcoded ingredientsToDeduct in pendingAction
// REAL: use Gemini structured output to extract meal + exact quantities
async function extractMealIngredients_REAL(mealName: string, systemPrompt: string) {
  const extractPrompt = `
    For the meal "${mealName}", list the exact ingredients and quantities needed.
    Return ONLY valid JSON: { ingredients: [{ item: string, qty: number, unit: string }] }
  `
  const response = await llm.invoke([new HumanMessage(extractPrompt)])
  const text = typeof response.content === 'string' ? response.content : ''
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean).ingredients
}


// ════════════════════════════════════════════════════════════════
// PRIORITY 5 — Day 5 (Memory)
// ════════════════════════════════════════════════════════════════

// Already covered above in PRIORITY 1
// embedText_REAL + searchMemories_REAL + storeMemory_REAL
// Just swap the mock implementations in lib/utils.ts


// ════════════════════════════════════════════════════════════════
// PRIORITY 6 — Day 6 (Calendar)
// ════════════════════════════════════════════════════════════════

// FILE: lib/calendar/index.ts → GoogleCalendarService.getTodayEvents()
// MOCK: returns MOCK_CALENDAR_EVENTS with provider: 'google'
// REAL: (full implementation already in the comments inside the file)
//   GET https://www.googleapis.com/calendar/v3/calendars/primary/events
//   Headers: Authorization: Bearer {access_token}
//   Params:  timeMin, timeMax, singleEvents=true, orderBy=startTime

// FILE: lib/calendar/index.ts → OutlookCalendarService.getTodayEvents()  
// MOCK: returns MOCK_CALENDAR_EVENTS with provider: 'outlook'
// REAL:
//   GET https://graph.microsoft.com/v1.0/me/calendarView
//   Headers: Authorization: Bearer {access_token}
//   Params:  startDateTime, endDateTime

// FILE: lib/utils.ts → getValidCalendarToken()
// MOCK: returns 'mock_access_token_123'
// REAL: (full implementation already in the comments inside the file)
//   1. Fetch from user_integrations where user_id = userId AND provider = provider
//   2. Check token_expires_at
//   3. If expired → call refresh endpoint → update DB → return new token
//   4. If valid   → return existing token


// ════════════════════════════════════════════════════════════════
// PRIORITY 7 — Day 7 (Voice)
// ════════════════════════════════════════════════════════════════

// FILE: app/api/voice/speak/route.ts
// MOCK: returns 204 if ELEVENLABS_API_KEY not set
// REAL: just add ELEVENLABS_API_KEY to .env.local — code is already production-ready

// FILE: lib/hooks/useVoice.ts → fallbackSpeak()
// This is already real — uses browser Web Speech Synthesis API
// No changes needed — it's the fallback when ElevenLabs is unavailable


// ════════════════════════════════════════════════════════════════
// SUPABASE CLIENT SETUP (needed for all REAL implementations)
// ════════════════════════════════════════════════════════════════

// FILE: lib/supabase.ts (create this file)
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!    // use service role on server
)

export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // use anon key on client
)

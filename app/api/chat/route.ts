import { NextResponse } from 'next/server'
import { evaOrchestrator, mealAgent, taskAgent, misAgent } from '../../../lib/agents'
import { getCalendarService } from '../../../lib/calendar'
import { scrubPII, searchMemories, storeMemory, getTodayName } from '../../../lib/utils'
import { supabaseServer } from '../../../lib/supabase'
import {
  MOCK_USER, MOCK_HEALTH_PROFILE, MOCK_WORK_PROFILE,
  MOCK_NOTIFICATION_PROFILE, MOCK_PANTRY, MOCK_MEAL_PREFERENCES
} from '../../../lib/mockData'

export async function POST(req: Request) {
  try {
    const { message, userId = 'priya_001', conversationHistory = [], privacyMode = false } = await req.json()

    // ── 1. Load user context ────────────────────────────────────────────────
    // Fetch all user data from Supabase in parallel
    const [
      { data: healthProfileRes },
      { data: workProfileRes },
      { data: notifProfileRes },
      { data: pantryRes },
      { data: likedMealsRes }
    ] = await Promise.all([
      supabaseServer
        .from('user_health_profile')
        .select('*')
        .eq('user_id', userId)
        .single()
        .catch(() => ({ data: MOCK_HEALTH_PROFILE })),
      supabaseServer
        .from('user_work_profile')
        .select('*')
        .eq('user_id', userId)
        .single()
        .catch(() => ({ data: MOCK_WORK_PROFILE })),
      supabaseServer
        .from('user_notification_profile')
        .select('*')
        .eq('user_id', userId)
        .single()
        .catch(() => ({ data: MOCK_NOTIFICATION_PROFILE })),
      supabaseServer
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId)
        .catch(() => ({ data: MOCK_PANTRY })),
      supabaseServer
        .from('meal_preferences')
        .select('*')
        .eq('user_id', userId)
        .catch(() => ({ data: MOCK_MEAL_PREFERENCES }))
    ])

    const healthProfile  = healthProfileRes || MOCK_HEALTH_PROFILE
    const workProfile    = workProfileRes || MOCK_WORK_PROFILE
    const notifProfile   = notifProfileRes || MOCK_NOTIFICATION_PROFILE
    const pantry         = pantryRes || MOCK_PANTRY
    const likedMeals     = likedMealsRes || MOCK_MEAL_PREFERENCES

    // ── 2. Scrub PII from incoming message ──────────────────────────────────
    const cleanMessage = scrubPII(message, healthProfile)

    // ── 3. Fetch relevant memories via vector search ─────────────────────────
    // REAL: embed cleanMessage → pgvector similarity search
    const memories = privacyMode ? [] : await searchMemories(cleanMessage, userId)

    // ── 4. Build messages array for LLM ─────────────────────────────────────
    const messages = [
      ...conversationHistory.slice(-10),  // keep last 10 turns for context
      { role: 'user', content: cleanMessage },
    ]

    // ── 5. EVA classifies intent ─────────────────────────────────────────────
    const { route } = await evaOrchestrator(messages, memories)

    // ── 6. Route to specialist agent ─────────────────────────────────────────
    let response     = ''
    let handledBy    = 'EVA'
    let pendingAction: any = undefined
    let lowStockAlerts: string[] = []

    if (route === 'MealAgent') {
      handledBy = 'MealAgent'
      const result = await mealAgent(messages, {
        healthProfile,
        pantry,
        likedMeals,
        memories,
      })
      response      = result.response
      pendingAction = result.pendingAction

      // Store any new learnings
      if (!privacyMode && result.learned) {
        await storeMemory(userId, 'MealAgent', JSON.stringify(result.learned), 'preference_learned')
      }

    } else if (route === 'TaskAgent') {
      handledBy = 'TaskAgent'

      // Fetch calendar events
      // REAL: check user_integrations to determine provider
      const calendarService = getCalendarService('mock')
      const calendarEvents  = await calendarService.getTodayEvents(userId)

      const result = await taskAgent(messages, {
        workProfile,
        calendarEvents,
        memories,
      })
      response = result.response

      if (!privacyMode && result.learned) {
        await storeMemory(userId, 'TaskAgent', JSON.stringify(result.learned), 'pattern_detected')
      }

    } else if (route === 'MisAgent') {
      handledBy = 'MisAgent'
      const result = await misAgent(messages, {
        notificationProfile: notifProfile,
        pantry,
        memories,
      })
      response       = result.response
      lowStockAlerts = result.lowStockAlerts ?? []

      if (!privacyMode) {
        await storeMemory(userId, 'MisAgent', `User requested: ${cleanMessage}`, 'event_context')
      }

    } else {
      // EVA answered directly
      const { response: evaResponse } = await evaOrchestrator(messages, memories)
      // Strip routing tokens from EVA's direct response
      response = evaResponse
        .replace('ROUTE_TO_MEALS', '')
        .replace('ROUTE_TO_TASKS', '')
        .replace('ROUTE_TO_MIS', '')
        .trim()
    }

    // ── 7. EVA proactive cross-domain check ─────────────────────────────────
    // Even when a specialist responds, EVA checks for cross-domain suggestions
    const today = getTodayName()
    const stressfulDayPattern = memories.find(m =>
      m.content.toLowerCase().includes(today.toLowerCase()) &&
      m.memory_type === 'pattern_detected'
    )

    let proactiveSuggestion: string | undefined
    if (stressfulDayPattern && route === 'TaskAgent') {
      proactiveSuggestion = `Also — ${today} tends to be heavy for you. Want me to keep dinner simple tonight?`
    }

    // ── 8. Store this interaction as memory ─────────────────────────────────
    if (!privacyMode) {
      await storeMemory(
        userId,
        handledBy,
        `User asked about ${route ? route.replace('Agent', '').toLowerCase() : 'general'} topic on ${today}`,
        'pattern_detected'
      )
    }

    return NextResponse.json({
      response,
      handledBy,
      pendingAction,
      proactiveSuggestion,
      lowStockAlerts,
    })

  } catch (error) {
    console.error('[/api/chat] Error:', error)
    return NextResponse.json({ error: 'Agent orchestration failed' }, { status: 500 })
  }
}

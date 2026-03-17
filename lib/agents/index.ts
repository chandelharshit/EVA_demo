import type {
  UserHealthProfile, UserWorkProfile, UserNotificationProfile,
  PantryItem, MealPreference, Memory, CalendarEvent, AgentName
} from '../../types'
import { extractContent, isQuietHours, getTodayName } from '../utils'

// ─── Shared LLM caller ───────────────────────────────────────────────────────
// REAL: replace with actual @langchain/google-genai ChatGoogleGenerativeAI call
// REAL: import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
// REAL: import { SystemMessage, HumanMessage } from '@langchain/core/messages'

async function callLLM(systemPrompt: string, messages: any[]): Promise<string> {
  // MOCK: return canned responses based on keywords
  console.log('[MOCK] callLLM — would call Gemini 1.5 Flash')

  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() ?? ''

  if (lastMsg.includes('cook') || lastMsg.includes('dinner') || lastMsg.includes('meal') || lastMsg.includes('food')) {
    return `Based on your pantry and preferences, I'd suggest **Palak Paneer** tonight!

Here's what you have:
- Spinach ✅ (200g available)
- Paneer ✅ (250g available)
- Onion ✅ (4 pieces)
- Tomato ✅ (3 pieces)

This takes about 25 minutes and is Aarav-safe (no dairy in the gravy base). Would you like to cook this tonight? I'll update your pantry automatically. 🍲`
  }

  if (lastMsg.includes('meeting') || lastMsg.includes('schedule') || lastMsg.includes('standup') || lastMsg.includes('calendar')) {
    return `Here's your schedule for today:

**10:00 AM** — Sprint Standup (30 min) with Raj, Neha
**3:00 PM** — Product Review (1 hr) with PM Lead

⚠️ Note: You have a gap between 10:30 and 3:00 — that's your deep work window. I'd protect it.

Thursday tends to be heavy for you. Want me to keep dinner simple tonight?`
  }

  if (lastMsg.includes('remind') || lastMsg.includes('alert') || lastMsg.includes('notification')) {
    return `Got it! I'll set a reminder for you. 

📌 **School pickup — Aarav** at 3:30 PM daily (Mon–Fri) is already active.

Want me to add any new reminder? Just tell me what and when.`
  }

  if (lastMsg.includes('mom') || lastMsg.includes('minutes')) {
    return `I'll generate the MOM for your Sprint Standup. 

Can you quickly tell me the key discussion points and any action items from today's standup?`
  }

  return `I'm EVA, your AI life-load assistant! I can help you with:
- 🍽️ **Meals** — suggest dinner, check pantry, plan the week
- 📋 **Tasks** — schedule, MOM generation, productivity tips  
- 🔔 **Alerts** — reminders, events, quiet hours

What would you like help with today?`

  /*
  REAL IMPLEMENTATION:
  const llm = new ChatGoogleGenerativeAI({
    modelName: 'gemini-1.5-flash',
    apiKey: process.env.GOOGLE_GEMINI_API_KEY,
  })
  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    ...messages.map(m => m.role === 'user'
      ? new HumanMessage(m.content)
      : new AIMessage(m.content)
    )
  ])
  return extractContent(response.content)
  */
}

// ─── EVA — Orchestrator ───────────────────────────────────────────────────────

export async function evaOrchestrator(
  messages: any[],
  memories: Memory[]
): Promise<{ response: string; route: AgentName | null }> {

  const memorySummary = memories
    .map(m => `- ${m.content}`)
    .join('\n')

  const systemPrompt = `You are EVA, the orchestrator of an AI life-load assistant for women.
You have these memories about the user:
${memorySummary}

Read the user's latest message carefully.
- If it's about food, meals, groceries, pantry, cooking, allergies, or nutrition → respond ONLY with: ROUTE_TO_MEALS
- If it's about meetings, calendar, work, tasks, MOM, productivity, schedule → respond ONLY with: ROUTE_TO_TASKS
- If it's about reminders, alerts, notifications, events, quiet hours → respond ONLY with: ROUTE_TO_MIS
- If the user wants to vent, express stress, or just talk → respond warmly and empathetically yourself
- Otherwise → answer warmly and helpfully yourself

Today is ${getTodayName()}. Be warm, concise, and proactive.`

  const rawResponse = await callLLM(systemPrompt, messages)

  if (rawResponse.includes('ROUTE_TO_MEALS')) return { response: rawResponse, route: 'MealAgent' }
  if (rawResponse.includes('ROUTE_TO_TASKS')) return { response: rawResponse, route: 'TaskAgent' }
  if (rawResponse.includes('ROUTE_TO_MIS'))   return { response: rawResponse, route: 'MisAgent'  }

  return { response: rawResponse, route: null }
}

// ─── MealAgent ────────────────────────────────────────────────────────────────

export interface MealAgentContext {
  healthProfile: UserHealthProfile
  pantry: PantryItem[]
  likedMeals: MealPreference[]
  memories: Memory[]
}

export async function mealAgent(
  messages: any[],
  context: MealAgentContext
): Promise<{ response: string; pendingAction?: any; learned?: any }> {

  const allergyList = context.healthProfile.family_members
    .flatMap(m => m.allergies ?? [])
    .join(', ') || 'none'

  const pantryList = context.pantry
    .map(p => `${p.item_name}: ${p.quantity}${p.unit}`)
    .join(', ')

  const likedList = context.likedMeals
    .map(m => m.meal_name)
    .join(', ')

  const memoryContext = context.memories
    .filter(m => m.agent === 'MealAgent')
    .map(m => `- ${m.content}`)
    .join('\n')

  const systemPrompt = `You are AILA's Meal & Health Agent. You help with meals, groceries, and nutrition.

USER CONTEXT:
- Family allergies: ${allergyList}
- Health conditions: ${context.healthProfile.health_conditions.join(', ')}
- Preferred cooking time (weekday): ${context.healthProfile.cooking_time_weekday} mins
- Diet type: ${context.healthProfile.diet_type}
- Liked meals: ${likedList}

CURRENT PANTRY:
${pantryList}

MEMORIES ABOUT THIS USER:
${memoryContext}

When suggesting meals:
1. Check pantry availability — mark each ingredient as ✅ (available) or ❌ (missing)
2. Always respect allergies — especially ${allergyList}
3. Keep weekday suggestions under ${context.healthProfile.cooking_time_weekday} mins
4. When you suggest a specific meal, end with: "Would you like to cook this tonight?"
5. If user confirms cooking, output: CONFIRM_COOKING:[meal_name]

Be warm, practical, and specific.`

  const response = await callLLM(systemPrompt, messages)

  // Detect if agent is suggesting a specific meal for confirmation
  // REAL: parse more robustly with structured Gemini output
  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() ?? ''
  let pendingAction = undefined

  if (response.toLowerCase().includes('would you like to cook') ||
      response.toLowerCase().includes('cook this tonight')) {
    // Extract meal name heuristically
    // REAL: use Gemini structured output to extract meal + ingredients
    const mealMatch = response.match(/\*\*(.*?)\*\*/)
    if (mealMatch) {
      pendingAction = {
        type: 'CONFIRM_COOKING',
        meal: mealMatch[1],
        ingredientsToDeduct: [
          // REAL: Gemini returns exact quantities to deduct
          { item: 'spinach', qty: 100, unit: 'g' },
          { item: 'paneer',  qty: 100, unit: 'g' },
          { item: 'onion',   qty: 2,   unit: 'pieces' },
          { item: 'tomato',  qty: 2,   unit: 'pieces' },
        ],
      }
    }
  }

  // Extract any learnings to store as memories
  const learned = lastMsg.includes('i like') || lastMsg.includes('favourite')
    ? { preference: lastMsg }
    : undefined

  return { response, pendingAction, learned }
}

// ─── TaskAgent ────────────────────────────────────────────────────────────────

export interface TaskAgentContext {
  workProfile: UserWorkProfile
  calendarEvents: CalendarEvent[]
  memories: Memory[]
}

export async function taskAgent(
  messages: any[],
  context: TaskAgentContext
): Promise<{ response: string; learned?: any }> {

  const today = getTodayName()
  const todayEvents = context.calendarEvents
    .map(e => {
      const start = new Date(e.start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      const end   = new Date(e.end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      const attendees = e.attendees.map(a => a.name).join(', ')
      return `- ${e.title} (${start}–${end}) | Attendees: ${attendees}`
    })
    .join('\n') || 'No meetings today'

  const memoryContext = context.memories
    .filter(m => m.agent === 'TaskAgent')
    .map(m => `- ${m.content}`)
    .join('\n')

  const systemPrompt = `You are AILA's Task & Productivity Agent. You help with work schedules, meetings, MOM generation, and productivity.

USER CONTEXT:
- Work hours: ${context.workProfile.work_hours_start} – ${context.workProfile.work_hours_end}
- Productivity drains: ${context.workProfile.productivity_drains.join(', ')}
- Task preference: ${context.workProfile.task_preference}

TODAY'S CALENDAR (${today}):
${todayEvents}

MEMORIES ABOUT THIS USER:
${memoryContext}

IMPORTANT — Calendar integration:
// REAL: calendar events fetched live from Google Calendar / Microsoft Graph API
// REAL: OAuth tokens stored in user_integrations table in Supabase
// MOCK: using static events from mockData.ts for now

For MOM generation:
- Ask for discussion points if not provided
- Output structured MOM with: title, date, attendees, discussion, action items, next steps
- Format action items as: [Owner] → [Task] → [Due Date]

For burnout detection:
- Flag days with 3+ back-to-back meetings
- Suggest proactive meal simplification or task deferral

Be direct, structured, and practical.`

  const response = await callLLM(systemPrompt, messages)

  // Detect burnout pattern
  // REAL: compute from actual calendar data
  const meetingCount = context.calendarEvents.length
  const learned = meetingCount >= 3
    ? { pattern: `${today} has ${meetingCount} meetings — potential stress day` }
    : undefined

  return { response, learned }
}

// ─── MisAgent ─────────────────────────────────────────────────────────────────

export interface MisAgentContext {
  notificationProfile: UserNotificationProfile
  pantry: PantryItem[]
  memories: Memory[]
}

export async function misAgent(
  messages: any[],
  context: MisAgentContext
): Promise<{ response: string; alertSuppressed?: boolean; lowStockAlerts?: string[] }> {

  // Check quiet hours before processing
  const inQuiet = isQuietHours(
    context.notificationProfile.quiet_hours_start,
    context.notificationProfile.quiet_hours_end
  )

  // Check pantry for low stock
  const lowStock = context.pantry.filter(p => p.quantity <= p.low_threshold)
  const lowStockAlerts = lowStock.map(p => `${p.item_name} (${p.quantity}${p.unit} left)`)

  const recurringList = context.notificationProfile.recurring_events
    .map(e => `- ${e.event} at ${e.time} on ${e.days.join(', ')}`)
    .join('\n')

  const systemPrompt = `You are AILA's Alerts & Reminders Agent. You manage notifications, reminders, and events.

USER CONTEXT:
- Quiet hours: ${context.notificationProfile.quiet_hours_start} – ${context.notificationProfile.quiet_hours_end}
- Alert style: ${context.notificationProfile.alert_style}
- Currently in quiet hours: ${inQuiet}

RECURRING EVENTS:
${recurringList}

LOW STOCK ITEMS:
${lowStockAlerts.length > 0 ? lowStockAlerts.map(i => `- ${i}`).join('\n') : 'All stocked'}

${inQuiet ? '⚠️ USER IS IN QUIET HOURS — only respond to urgent requests. Do not proactively alert.' : ''}

For reminders:
- Acknowledge clearly what you've set
- Respect quiet hours — don't confirm noisy alerts during quiet window
- Be gentle (user preference: ${context.notificationProfile.alert_style})

For low stock:
- Mention items that need restocking
- Offer to add to grocery list`

  if (inQuiet) {
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() ?? ''
    const isUrgent = lastMsg.includes('urgent') || lastMsg.includes('emergency')

    if (!isUrgent) {
      return {
        response: `You're in quiet hours right now (${context.notificationProfile.quiet_hours_start}–${context.notificationProfile.quiet_hours_end}). I'll hold non-urgent alerts. Send again tomorrow or say "urgent" if it can't wait. 🌙`,
        alertSuppressed: true,
        lowStockAlerts,
      }
    }
  }

  const response = await callLLM(systemPrompt, messages)
  return { response, alertSuppressed: false, lowStockAlerts }
}

// ─── Onboarding Agent ─────────────────────────────────────────────────────────

export async function onboardingAgent(
  step: string,
  messages: any[]
): Promise<{ response: string; extractedData?: any; stepComplete: boolean }> {

  const questionSets: Record<string, string[]> = {
    MEAL: [
      "Hi! I'm your Meal Assistant 🍽️ Any allergies or food restrictions in your family?",
      "Does anyone have a health condition I should cook around? (diabetes, thyroid, BP, iron deficiency...)",
      "How much time can you spare for cooking on weekdays?",
      "Any cuisines your family loves or avoids?",
      "How many people are you usually cooking for? And are you veg, non-veg, or vegan?",
    ],
    TASK: [
      "Now let me understand your work life 📋 What are your core working hours?",
      "Do you have any recurring meetings I should know about?",
      "What drains you most — back-to-back meetings, late calls, or context switching?",
      "Do you prefer tasks grouped by priority or by time of day?",
    ],
    MIS: [
      "Almost done! 🔔 What are your quiet hours — when should I never disturb you?",
      "How do you prefer reminders — gentle nudge or firm alerts?",
      "Any recurring events I should always track? (school pickup, medication, gym...)",
    ],
  }

  const questions = questionSets[step] ?? []
  const questionCount = messages.filter(m => m.role === 'assistant').length

  // If we've asked all questions, extract structured data
  if (questionCount >= questions.length) {
    const allAnswers = messages.map(m => `${m.role}: ${m.content}`).join('\n')

    const extractPrompt = `Extract structured JSON from this onboarding conversation for step ${step}.
    
Conversation:
${allAnswers}

Return ONLY valid JSON matching this shape for ${step}:
${step === 'MEAL' ? '{ family_members: [], health_conditions: [], cooking_time_weekday: number, cuisine_preferences: [], diet_type: string, household_size: number }' : ''}
${step === 'TASK' ? '{ work_hours_start: string, work_hours_end: string, recurring_meetings: [], productivity_drains: [], task_preference: string }' : ''}
${step === 'MIS'  ? '{ quiet_hours_start: string, quiet_hours_end: string, alert_style: string, recurring_events: [] }' : ''}

REAL: send this to Gemini and parse the JSON response
MOCK: return empty structure`

    // REAL: call Gemini here and parse JSON
    // MOCK: return empty extracted data
    const extractedData = {}

    return {
      response: `Great, I've noted everything! Let me hand you over to the next assistant.`,
      extractedData,
      stepComplete: true,
    }
  }

  // Ask next question
  const nextQuestion = questions[questionCount] ?? "Thank you for sharing that!"

  return {
    response: nextQuestion,
    stepComplete: false,
  }
}

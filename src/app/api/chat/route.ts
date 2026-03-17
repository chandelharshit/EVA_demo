// ─────────────────────────────────────────────
//  AILA — POST /api/chat
//  Main multi-agent LangGraph handler
// ─────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { StateGraph, START, END, Annotation } from '@langchain/langgraph'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages'

import type { ChatRequest, ChatResponse, PendingAction, Agent } from '../../../types'
import {
  MOCK_HEALTH_PROFILE, MOCK_WORK_PROFILE, MOCK_NOTIF_PROFILE,
  MOCK_PANTRY, MOCK_CALENDAR_EVENTS
} from '../../../lib/mockData'
import { scrubPII, searchMemories, storeMemory, extractContent, getTodayDayName } from '../../../lib/utils'
import { buildEVAPrompt, buildMealAgentPrompt, buildTaskAgentPrompt, buildMisAgentPrompt } from '../../../lib/agents/prompts'
import { getCalendarService } from '../../../lib/calendar'

// ── LangGraph State ───────────────────────────
const GraphState = Annotation.Root({
  messages:          Annotation<any[]>({ reducer: (x, y) => x.concat(y), default: () => [] }),
  sender:            Annotation<Agent>({ reducer: (_x, y) => y ?? _x, default: () => 'EVA' }),
  userId:            Annotation<string>({ reducer: (_x, y) => y ?? _x, default: () => '' }),
  pendingAction:     Annotation<PendingAction | null>({ reducer: (_x, y) => y ?? _x, default: () => null }),
  proactiveSuggestion: Annotation<string>({ reducer: (_x, y) => y ?? _x, default: () => '' }),
  isVoice:           Annotation<boolean>({ reducer: (_x, y) => y ?? _x, default: () => false }),
  privacyMode:       Annotation<boolean>({ reducer: (_x, y) => y ?? _x, default: () => false }),
})

// ── Gemini LLM ────────────────────────────────
// TODO: ensure GOOGLE_GEMINI_API_KEY is set in .env.local
const llm = new ChatGoogleGenerativeAI({
  modelName: 'gemini-1.5-flash',
  apiKey: process.env.GOOGLE_GEMINI_API_KEY,
  temperature: 0.7,
})

// ── EVA Node ──────────────────────────────────
async function evaNode(state: typeof GraphState.State) {
  const userId   = state.userId
  const isVoice  = state.isVoice
  const todayDay = getTodayDayName()

  // Fetch top-5 memories (TODO: real pgvector search)
  const memories = await searchMemories(
    extractContent(state.messages.at(-1)?.content),
    userId
  )

  const systemPrompt = new SystemMessage(
    buildEVAPrompt(memories, todayDay, isVoice)
  )

  const response = await llm.invoke([systemPrompt, ...state.messages])

  // Check if EVA wants to add a proactive suggestion
  const content = extractContent(response.content)
  let proactiveSuggestion = ''
  if (content.includes('PROACTIVE:')) {
    const match = content.match(/PROACTIVE:(.*?)(?:\n|$)/)
    proactiveSuggestion = match?.[1]?.trim() ?? ''
  }

  return {
    messages: [response],
    sender: 'EVA' as Agent,
    proactiveSuggestion,
  }
}

// ── MealAgent Node ────────────────────────────
async function mealAgentNode(state: typeof GraphState.State) {
  const userId  = state.userId
  const isVoice = state.isVoice

  // TODO: fetch from Supabase
  const healthProfile = MOCK_HEALTH_PROFILE
  const pantry        = MOCK_PANTRY

  const memories = await searchMemories(
    extractContent(state.messages.at(-1)?.content),
    userId
  )

  const systemPrompt = new SystemMessage(
    buildMealAgentPrompt(healthProfile, pantry, memories, isVoice)
  )

  const response = await llm.invoke([systemPrompt, ...state.messages])
  const content  = extractContent(response.content)

  // Extract pendingAction if meal was suggested
  let pendingAction: PendingAction | null = null
  const pendingMatch = content.match(/PENDING_ACTION:(\{.*?\})/s)
  if (pendingMatch) {
    try { pendingAction = JSON.parse(pendingMatch[1]) } catch {}
  }

  // Extract pantry update if user mentioned buying items
  const pantryMatch = content.match(/PANTRY_UPDATE:(\[.*?\])/s)
  if (pantryMatch && !state.privacyMode) {
    try {
      const updates = JSON.parse(pantryMatch[1])
      // TODO: upsert to Supabase pantry_items
      console.log('[Pantry update]', updates)
    } catch {}
  }

  // Store learning if not in privacy mode
  if (!state.privacyMode) {
    await storeMemory(userId, 'MealAgent', `User interacted with meal suggestions`, 'feedback_signal')
  }

  return {
    messages: [response],
    sender: 'MealAgent' as Agent,
    pendingAction,
  }
}

// ── TaskAgent Node ────────────────────────────
async function taskAgentNode(state: typeof GraphState.State) {
  const userId  = state.userId
  const isVoice = state.isVoice

  // TODO: fetch from Supabase
  const workProfile = MOCK_WORK_PROFILE

  // Calendar — uses abstraction layer
  const calendarSvc = getCalendarService(
    workProfile.calendarProvider,
    workProfile.calendarConnected
  )
  const calendarEvents = await calendarSvc.getTodayEvents(userId)

  const memories = await searchMemories(
    extractContent(state.messages.at(-1)?.content),
    userId
  )

  const systemPrompt = new SystemMessage(
    buildTaskAgentPrompt(workProfile, calendarEvents, memories, isVoice)
  )

  const response = await llm.invoke([systemPrompt, ...state.messages])

  if (!state.privacyMode) {
    await storeMemory(userId, 'TaskAgent', `User asked about tasks/meetings`, 'feedback_signal')
  }

  return {
    messages: [response],
    sender: 'TaskAgent' as Agent,
  }
}

// ── MisAgent Node ─────────────────────────────
async function misAgentNode(state: typeof GraphState.State) {
  const userId  = state.userId
  const isVoice = state.isVoice

  // TODO: fetch from Supabase
  const notifProfile = MOCK_NOTIF_PROFILE

  // Check pantry for low stock items
  const lowStockItems = MOCK_PANTRY
    .filter(p => p.quantity < p.lowThreshold)
    .map(p => p.itemName)

  const memories = await searchMemories(
    extractContent(state.messages.at(-1)?.content),
    userId
  )

  const systemPrompt = new SystemMessage(
    buildMisAgentPrompt(notifProfile, lowStockItems, memories, isVoice)
  )

  const response = await llm.invoke([systemPrompt, ...state.messages])
  const content  = extractContent(response.content)

  // Extract reminder pending action
  let pendingAction: PendingAction | null = null
  const pendingMatch = content.match(/PENDING_ACTION:(\{.*?\})/s)
  if (pendingMatch) {
    try { pendingAction = JSON.parse(pendingMatch[1]) } catch {}
  }

  if (!state.privacyMode) {
    await storeMemory(userId, 'MisAgent', `User interacted with reminders/alerts`, 'feedback_signal')
  }

  return {
    messages: [response],
    sender: 'MisAgent' as Agent,
    pendingAction,
  }
}

// ── Router ────────────────────────────────────
function router(state: typeof GraphState.State) {
  const content = extractContent(state.messages.at(-1)?.content)
  if (content.includes('ROUTE_TO_MEALS')) return 'MealAgent'
  if (content.includes('ROUTE_TO_TASKS')) return 'TaskAgent'
  if (content.includes('ROUTE_TO_MIS'))   return 'MisAgent'
  return END
}

// ── Build Graph ───────────────────────────────
const workflow = new StateGraph(GraphState)
  .addNode('EVA',       evaNode)
  .addNode('MealAgent', mealAgentNode)
  .addNode('TaskAgent', taskAgentNode)
  .addNode('MisAgent',  misAgentNode)
  .addEdge(START, 'EVA')
  .addConditionalEdges('EVA', router)
  .addEdge('MealAgent', END)
  .addEdge('TaskAgent', END)
  .addEdge('MisAgent',  END)

const graph = workflow.compile()

// ── POST Handler ──────────────────────────────
export async function POST(req: Request) {
  try {
    const body: ChatRequest = await req.json()
    const { message, userId, conversationHistory, privacyMode, isVoice } = body

    // Scrub PII before any LLM call
    const cleanMessage = scrubPII(message, MOCK_HEALTH_PROFILE)

    // Convert history to LangChain messages
    const historyMessages = conversationHistory.slice(-10).map(m =>
      m.role === 'user'
        ? new HumanMessage(m.content)
        : new AIMessage(m.content)
    )

    // Run the graph
    const finalState = await graph.invoke({
      messages: [...historyMessages, new HumanMessage(cleanMessage)],
      userId,
      privacyMode,
      isVoice: isVoice ?? false,
    })

    // Extract final response — clean out routing tokens and action markers
    const rawResponse = extractContent(finalState.messages.at(-1)?.content ?? '')
    const cleanResponse = rawResponse
      .replace(/ROUTE_TO_\w+/g, '')
      .replace(/PENDING_ACTION:\{.*?\}/gs, '')
      .replace(/PANTRY_UPDATE:\[.*?\]/gs, '')
      .replace(/SECTION_COMPLETE:\{.*?\}/gs, '')
      .replace(/PROACTIVE:.*?\n/g, '')
      .trim()

    const response: ChatResponse = {
      response:            cleanResponse,
      handledBy:           finalState.sender,
      pendingAction:       finalState.pendingAction ?? undefined,
      proactiveSuggestion: finalState.proactiveSuggestion || undefined,
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[Chat API Error]', error)
    return NextResponse.json(
      { error: 'Agent orchestration failed', details: String(error) },
      { status: 500 }
    )
  }
}

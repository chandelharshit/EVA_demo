// ─────────────────────────────────────────────
//  AILA — POST /api/onboarding
// ─────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages'

import type { OnboardingRequest, OnboardingResponse, Agent, OnboardingStep } from '../../../types'
import { ONBOARDING_QUESTIONS } from '../../../lib/mockData'
import { buildOnboardingPrompt } from '../../../lib/agents/prompts'
import { extractContent } from '../../../lib/utils'

const llm = new ChatGoogleGenerativeAI({
  modelName: 'gemini-1.5-flash',
  apiKey: process.env.GOOGLE_GEMINI_API_KEY,
  temperature: 0.8,
})

const STEP_TO_AGENT: Record<string, Agent> = {
  MEAL: 'MealAgent',
  TASK: 'TaskAgent',
  MIS:  'MisAgent',
}

const NEXT_STEP: Record<string, OnboardingStep> = {
  MEAL: 'TASK',
  TASK: 'MIS',
  MIS:  'SUMMARY',
}

export async function POST(req: Request) {
  try {
    const body: OnboardingRequest = await req.json()
    const { userId, step, message, conversationHistory } = body

    const questionIndex  = Math.floor(conversationHistory.filter(m => m.role === 'assistant').length)
    const questions      = ONBOARDING_QUESTIONS[step as keyof typeof ONBOARDING_QUESTIONS] ?? []
    const currentAgent   = STEP_TO_AGENT[step] ?? 'EVA'

    const systemPrompt = new SystemMessage(
      buildOnboardingPrompt(step, questionIndex)
    )

    const historyMessages = conversationHistory.slice(-8).map(m =>
      m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
    )

    const response = await llm.invoke([
      systemPrompt,
      ...historyMessages,
      new HumanMessage(message),
    ])

    const content     = extractContent(response.content)
    const isComplete  = content.includes('SECTION_COMPLETE:')

    // If section complete — extract and save structured data
    if (isComplete && !false /* TODO: check privacyMode */) {
      const match = content.match(/SECTION_COMPLETE:(\{.*?\})/s)
      if (match) {
        try {
          const extracted = JSON.parse(match[1])
          // TODO: upsert to appropriate Supabase table based on step
          // if (step === 'MEAL') await supabase.from('user_health_profile').upsert({ user_id: userId, ...extracted })
          // if (step === 'TASK') await supabase.from('user_work_profile').upsert({ user_id: userId, ...extracted })
          // if (step === 'MIS')  await supabase.from('user_notification_profile').upsert({ user_id: userId, ...extracted })
          // TODO: update users.onboarding_step = NEXT_STEP[step]
          console.log(`[Onboarding] ${step} complete for ${userId}:`, extracted)
        } catch (e) {
          console.error('[Onboarding parse error]', e)
        }
      }
    }

    const cleanResponse = content
      .replace(/SECTION_COMPLETE:\{.*?\}/gs, '')
      .trim()

    const result: OnboardingResponse = {
      response:    cleanResponse || questions[questionIndex] || "Got it! Let's continue.",
      agent:       currentAgent,
      stepComplete: isComplete,
      nextStep:    isComplete ? NEXT_STEP[step] : (step as OnboardingStep),
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('[Onboarding API Error]', error)
    return NextResponse.json({ error: 'Onboarding failed' }, { status: 500 })
  }
}

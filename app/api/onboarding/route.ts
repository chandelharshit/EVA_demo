import { NextResponse } from 'next/server'
import { onboardingAgent } from '../../../lib/agents'

export async function POST(req: Request) {
  try {
    const {
      userId = 'priya_001',
      step,
      message,
      conversationHistory = [],
    } = await req.json()

    const messages = [
      ...conversationHistory,
      { role: 'user', content: message },
    ]

    const result = await onboardingAgent(step, messages)

    if (result.stepComplete && result.extractedData) {
      // REAL: save extracted data to the correct Supabase table
      // REAL: step === 'MEAL' → supabase.from('user_health_profile').upsert(result.extractedData)
      // REAL: step === 'TASK' → supabase.from('user_work_profile').upsert(result.extractedData)
      // REAL: step === 'MIS'  → supabase.from('user_notification_profile').upsert(result.extractedData)

      const nextStepMap: Record<string, string> = {
        MEAL: 'TASK',
        TASK: 'MIS',
        MIS:  'SUMMARY',
      }

      // REAL: supabase.from('users').update({ onboarding_step: nextStep }).eq('id', userId)
      console.log('[MOCK] Saving onboarding data for step:', step, result.extractedData)

      return NextResponse.json({
        response:     result.response,
        agent:        step,
        stepComplete: true,
        nextStep:     nextStepMap[step] ?? 'DONE',
      })
    }

    return NextResponse.json({
      response:     result.response,
      agent:        step,
      stepComplete: false,
      nextStep:     step,
    })

  } catch (error) {
    console.error('[/api/onboarding] Error:', error)
    return NextResponse.json({ error: 'Onboarding failed' }, { status: 500 })
  }
}

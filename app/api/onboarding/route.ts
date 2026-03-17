import { NextResponse } from 'next/server'
import { onboardingAgent } from '../../../lib/agents'
import { supabaseServer } from '../../../lib/supabase'

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
      // Save extracted data to the correct Supabase table based on step
      try {
        if (step === 'MEAL') {
          await supabaseServer
            .from('user_health_profile')
            .upsert({ ...result.extractedData, user_id: userId })
        } else if (step === 'TASK') {
          await supabaseServer
            .from('user_work_profile')
            .upsert({ ...result.extractedData, user_id: userId })
        } else if (step === 'MIS') {
          await supabaseServer
            .from('user_notification_profile')
            .upsert({ ...result.extractedData, user_id: userId })
        }

        // Update user's onboarding progress
        const nextStepMap: Record<string, string> = {
          MEAL: 'TASK',
          TASK: 'MIS',
          MIS:  'DONE',
        }

        const nextStep = nextStepMap[step] ?? 'DONE'
        await supabaseServer
          .from('users')
          .update({ onboarding_step: nextStep })
          .eq('id', userId)

        return NextResponse.json({
          response:     result.response,
          agent:        step,
          stepComplete: true,
          nextStep:     nextStep,
        })
      } catch (error) {
        console.error('Error saving onboarding data:', error)
        return NextResponse.json(
          { error: 'Failed to save onboarding data' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json({
        response:     result.response,
        agent:        step,
        stepComplete: false,
        nextStep:     step,
      })
    }

  } catch (error) {
    console.error('[/api/onboarding] Error:', error)
    return NextResponse.json({ error: 'Onboarding failed' }, { status: 500 })
  }
}

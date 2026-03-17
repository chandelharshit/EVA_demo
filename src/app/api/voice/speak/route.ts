// ─────────────────────────────────────────────
//  AILA — POST /api/voice/speak
//  Converts agent text response to audio via ElevenLabs
//  Falls back to signal for Web Speech API if key missing
// ─────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { scrubPII } from '../../../../lib/utils'

// EVA's voice ID from ElevenLabs
// TODO: set ELEVENLABS_API_KEY and EVA_VOICE_ID in .env.local
// Recommended voice: Rachel (warm, clear) = 21m00Tcm4TlvDq8ikWAM
const VOICE_ID      = process.env.EVA_VOICE_ID      ?? '21m00Tcm4TlvDq8ikWAM'
const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY ?? ''

export async function POST(req: Request) {
  try {
    const { text, agent }: { text: string; agent?: string } = await req.json()

    // Scrub PII before sending to external TTS service
    const cleanText = scrubPII(text)

    // Truncate for voice — agents have voice-optimised prompts but safety cap here too
    const voiceText = cleanText.slice(0, 500)

    // If no ElevenLabs key — signal frontend to use Web Speech API fallback
    if (!ELEVENLABS_KEY) {
      return NextResponse.json({
        useFallback: true,
        text: voiceText,
      })
    }

    // Agent-specific voice settings
    const voiceSettings = getVoiceSettings(agent)

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key':   ELEVENLABS_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text:         voiceText,
          model_id:     'eleven_turbo_v2',   // lowest latency
          voice_settings: voiceSettings,
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      console.error('[ElevenLabs Error]', err)
      // Fallback gracefully
      return NextResponse.json({ useFallback: true, text: voiceText })
    }

    const audioBuffer = await response.arrayBuffer()

    return new Response(audioBuffer, {
      headers: {
        'Content-Type':  'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })

  } catch (error) {
    console.error('[Voice API Error]', error)
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}

function getVoiceSettings(agent?: string) {
  // Each agent has a slightly different vocal tone
  // Same voice ID — different stability/style settings
  const settings: Record<string, object> = {
    EVA:       { stability: 0.5, similarity_boost: 0.75, style: 0.3  },  // warm, natural
    MealAgent: { stability: 0.6, similarity_boost: 0.70, style: 0.25 },  // friendly, practical
    TaskAgent: { stability: 0.7, similarity_boost: 0.75, style: 0.15 },  // clear, direct
    MisAgent:  { stability: 0.6, similarity_boost: 0.70, style: 0.2  },  // gentle, reassuring
  }
  return settings[agent ?? 'EVA'] ?? settings.EVA
}

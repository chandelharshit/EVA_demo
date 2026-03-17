import { NextResponse } from 'next/server'
import { scrubPII } from '../../../../lib/utils'

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    // Always scrub PII before sending to any external TTS service
    const cleanText = scrubPII(text)

    // ── ElevenLabs TTS ──────────────────────────────────────────────────────
    // REAL: set EVA_VOICE_ID in .env — recommended: "Rachel" (warm, clear)
    // REAL: set ELEVENLABS_API_KEY in .env
    // REAL: free tier = 10,000 chars/month — enough for hackathon demo

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
    const EVA_VOICE_ID       = process.env.EVA_VOICE_ID ?? '21m00Tcm4TlvDq8ikWAM' // Rachel

    if (!ELEVENLABS_API_KEY) {
      // Return empty audio with 204 No Content — frontend will use browser TTS fallback
      console.warn('[Voice] ELEVENLABS_API_KEY not set — returning empty audio for browser TTS fallback')
      // Return empty blob that frontend can detect
      return new Response(new Blob([], { type: 'audio/mpeg' }), {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      })
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${EVA_VOICE_ID}`,
      {
        method:  'POST',
        headers: {
          'xi-api-key':   ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept':       'audio/mpeg',
        },
        body: JSON.stringify({
          text:     cleanText,
          model_id: 'eleven_turbo_v2',    // fastest, lowest latency for real-time feel
          voice_settings: {
            stability:        0.5,
            similarity_boost: 0.75,
            style:            0.3,        // slight warmth — not robotic, not over-cheerful
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('[Voice] ElevenLabs error:', error)
      
      // Check if error is due to invalid API key — if so, return empty audio for fallback
      if (error.includes('invalid_api_key') || error.includes('Invalid API key')) {
        console.warn('[Voice] Invalid ElevenLabs API key — returning empty audio for browser TTS fallback')
        return new Response(new Blob([], { type: 'audio/mpeg' }), {
          status: 200,
          headers: { 'Content-Type': 'audio/mpeg' },
        })
      }
      
      return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
    }

    const audioBuffer = await response.arrayBuffer()

    return new Response(audioBuffer, {
      headers: {
        'Content-Type':  'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })

  } catch (error) {
    console.error('[/api/voice/speak] Error:', error)
    return NextResponse.json({ error: 'Voice synthesis failed' }, { status: 500 })
  }
}

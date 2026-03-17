'use client'
// ─────────────────────────────────────────────
//  AILA — useVoice hook
//  STT: Web Speech API (browser-native, free)
//  TTS: ElevenLabs (with Web Speech fallback)
// ─────────────────────────────────────────────

import { useState, useRef, useCallback } from 'react'

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking'

interface UseVoiceReturn {
  voiceState:    VoiceState
  transcript:    string
  isSupported:   boolean
  startListening: () => void
  stopListening:  () => void
  speak:         (text: string, agent?: string) => Promise<void>
  cancelSpeaking: () => void
}

export function useVoice(onTranscriptComplete?: (text: string) => void): UseVoiceReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')

  const recognitionRef = useRef<any>(null)
  const audioRef       = useRef<HTMLAudioElement | null>(null)
  const utteranceRef   = useRef<SpeechSynthesisUtterance | null>(null)

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  // ── STT — Start listening ─────────────────
  const startListening = useCallback(() => {
    if (!isSupported) return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    const recognition = new SpeechRecognition()
    recognition.continuous     = false
    recognition.interimResults = true
    recognition.lang           = 'en-IN'   // Indian English

    recognition.onresult = (e: any) => {
      const text = Array.from(e.results as any[])
        .map((r: any) => r[0].transcript)
        .join('')
      setTranscript(text)
    }

    recognition.onend = () => {
      setVoiceState('idle')
      // Auto-submit if we got a transcript
      if (transcript) {
        onTranscriptComplete?.(transcript)
        setTranscript('')
      }
    }

    recognition.onerror = (e: any) => {
      console.error('[STT Error]', e.error)
      setVoiceState('idle')
    }

    recognitionRef.current = recognition
    recognition.start()
    setVoiceState('listening')
  }, [isSupported, transcript, onTranscriptComplete])

  // ── STT — Stop listening ──────────────────
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setVoiceState('idle')
    if (transcript) {
      onTranscriptComplete?.(transcript)
      setTranscript('')
    }
  }, [transcript, onTranscriptComplete])

  // ── TTS — Speak response ──────────────────
  const speak = useCallback(async (text: string, agent = 'EVA') => {
    cancelSpeaking()
    setVoiceState('speaking')

    try {
      const res = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, agent }),
      })

      const data = await res.json().catch(() => null)

      // Fallback: use Web Speech Synthesis
      if (data?.useFallback || !res.ok) {
        useFallbackTTS(data?.text ?? text, () => setVoiceState('idle'))
        return
      }

      // Play ElevenLabs audio
      const audioBlob = await res.blob()
      const audioUrl  = URL.createObjectURL(audioBlob)
      const audio     = new Audio(audioUrl)
      audioRef.current = audio

      audio.onended = () => {
        setVoiceState('idle')
        URL.revokeObjectURL(audioUrl)
      }
      audio.onerror = () => {
        setVoiceState('idle')
        // Fallback on audio error
        useFallbackTTS(text, () => setVoiceState('idle'))
      }

      await audio.play()

    } catch (err) {
      console.error('[TTS Error]', err)
      useFallbackTTS(text, () => setVoiceState('idle'))
    }
  }, [])

  // ── Cancel speaking ───────────────────────
  const cancelSpeaking = useCallback(() => {
    audioRef.current?.pause()
    audioRef.current = null
    window.speechSynthesis?.cancel()
    setVoiceState('idle')
  }, [])

  return {
    voiceState,
    transcript,
    isSupported,
    startListening,
    stopListening,
    speak,
    cancelSpeaking,
  }
}

// ── Web Speech Synthesis fallback ─────────────
function useFallbackTTS(text: string, onEnd: () => void) {
  if (!window.speechSynthesis) { onEnd(); return }

  window.speechSynthesis.cancel()
  const utterance     = new SpeechSynthesisUtterance(text)
  utterance.rate      = 0.95
  utterance.pitch     = 1.05
  utterance.volume    = 1
  utterance.lang      = 'en-IN'

  // Pick a natural-sounding voice if available
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v =>
    v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen')
  )
  if (preferred) utterance.voice = preferred

  utterance.onend = onEnd
  window.speechSynthesis.speak(utterance)
}

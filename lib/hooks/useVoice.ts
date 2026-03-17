'use client'

import { useState, useRef, useCallback } from 'react'
import type { VoiceState } from '../../types'

interface UseVoiceReturn {
  voiceState:     VoiceState
  transcript:     string
  startListening: () => void
  stopListening:  () => void
  speak:          (text: string) => Promise<void>
  cancelSpeech:   () => void
  isSupported:    boolean
}

export function useVoice(onTranscriptComplete?: (text: string) => void): UseVoiceReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')

  const recognitionRef = useRef<any>(null)
  const audioRef       = useRef<HTMLAudioElement | null>(null)
  const isSupported    = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  // ── STT — Speech to Text ──────────────────────────────────────────────────
  // Uses Web Speech API (browser-native, free, works offline)
  // REAL: alternatively use Gemini Live API for better accuracy
  // REAL: set lang based on user preference — 'en-IN' for Indian English

  const startListening = useCallback(() => {
    if (!isSupported) {
      console.warn('[Voice] Web Speech API not supported in this browser')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous     = false
    recognition.interimResults = true     // show words as user speaks
    recognition.lang           = 'en-IN'  // Indian English

    recognition.onstart = () => {
      setVoiceState('listening')
      setTranscript('')
    }

    recognition.onresult = (event: any) => {
      const text = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript)
        .join('')
      setTranscript(text)
    }

    recognition.onend = () => {
      setVoiceState('idle')
      // Auto-submit when user stops speaking
      if (transcript && onTranscriptComplete) {
        onTranscriptComplete(transcript)
        setTranscript('')
      }
    }

    recognition.onerror = (event: any) => {
      console.error('[Voice] STT error:', event.error)
      setVoiceState('idle')
    }

    recognition.start()
    recognitionRef.current = recognition
  }, [isSupported, transcript, onTranscriptComplete])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setVoiceState('idle')
  }, [])

  // ── TTS — Text to Speech ──────────────────────────────────────────────────
  // Calls /api/voice/speak which hits ElevenLabs API
  // Falls back to Web Speech Synthesis if API fails

  const speak = useCallback(async (text: string) => {
    setVoiceState('speaking')

    try {
      // REAL: calls ElevenLabs via /api/voice/speak
      const res = await fetch('/api/voice/speak', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text }),
      })

      if (!res.ok) throw new Error('TTS API failed')

      const audioBlob = await res.blob()
      
      // If blob is empty (fallback case when API key not configured), use browser TTS
      if (audioBlob.size === 0) {
        console.warn('[Voice] Empty audio blob received, using browser TTS fallback')
        fallbackSpeak(text)
        return
      }
      
      const audioUrl  = URL.createObjectURL(audioBlob)
      const audio     = new Audio(audioUrl)

      audioRef.current = audio

      audio.onended = () => {
        setVoiceState('idle')
        URL.revokeObjectURL(audioUrl)
      }

      audio.onerror = () => {
        // Fallback to browser TTS
        fallbackSpeak(text)
      }

      await audio.play()

    } catch (err) {
      console.warn('[Voice] ElevenLabs failed, falling back to browser TTS:', err)
      fallbackSpeak(text)
    }
  }, [])

  // ── Fallback TTS ─────────────────────────────────────────────────────────
  // Used when ElevenLabs quota is hit or API fails
  // REAL: remove once ElevenLabs is set up

  const fallbackSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance  = new SpeechSynthesisUtterance(text)
      utterance.lang   = 'en-IN'
      utterance.rate   = 0.95
      utterance.pitch  = 1.1

      // Try to find a natural-sounding female voice
      const voices = window.speechSynthesis.getVoices()
      const preferred = voices.find(v =>
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('victoria')
      )
      if (preferred) utterance.voice = preferred

      utterance.onend = () => setVoiceState('idle')
      window.speechSynthesis.speak(utterance)
    } else {
      setVoiceState('idle')
    }
  }

  const cancelSpeech = useCallback(() => {
    audioRef.current?.pause()
    window.speechSynthesis?.cancel()
    setVoiceState('idle')
  }, [])

  return {
    voiceState,
    transcript,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
    isSupported,
  }
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useVoice } from '../../lib/hooks/useVoice'
import type { OnboardingStep } from '../../types'

const AGENT_META: Record<string, { name: string; color: string; icon: string; label: string }> = {
  GREETING: { name: 'EVA',        color: '#7c6ff7', icon: 'E', label: 'Your AI assistant'        },
  MEAL:     { name: 'MealAgent',  color: '#10b981', icon: 'M', label: 'Meal & Health Assistant'   },
  TASK:     { name: 'TaskAgent',  color: '#f59e0b', icon: 'T', label: 'Task & Work Assistant'     },
  MIS:      { name: 'MisAgent',   color: '#0ea5e9', icon: 'A', label: 'Alerts & Events Assistant' },
  SUMMARY:  { name: 'EVA',        color: '#7c6ff7', icon: 'E', label: 'Your AI assistant'        },
}

const TOTAL_QUESTIONS = 12

const EVA_GREETING =
  "Hi! I'm EVA 👋 I'll introduce you to my team who'll each ask you a few questions to set up your profile. Let's start with meals!"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agent: string
}

export default function OnboardingPage() {
  const router = useRouter()

  const [step, setStep]               = useState<string>('GREETING')
  const [messages, setMessages]       = useState<Message[]>([
    { id: '0', role: 'assistant', content: EVA_GREETING, agent: 'GREETING' },
  ])
  const [input, setInput]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [questionNum, setQuestionNum] = useState(0)
  const [history, setHistory]         = useState<{ role: string; content: string }[]>([])
  const [privacyMode, setPrivacyMode] = useState(false)

  const bottomRef      = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLInputElement>(null)
  const hasInitialized = useRef(false)

  // FIX: Keep a ref of current history so sendMessage always reads latest value
  // (fixes the "f" bug where stale closure captured only first character)
  const historyRef = useRef<{ role: string; content: string }[]>([])
  const stepRef    = useRef<string>('GREETING')

  const agent = AGENT_META[step] ?? AGENT_META.MEAL

  // FIX: Voice callback uses ref so it never reads stale state
  const { voiceState, transcript, startListening, stopListening, speak, isSupported } = useVoice(
    (text) => {
      if (text.trim()) {
        sendMessage(text)   // pass text directly, don't rely on input state
      }
    }
  )

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true
    speak(EVA_GREETING)
    setTimeout(() => {
      setStep('MEAL')
      stepRef.current = 'MEAL'
      askNextQuestion('MEAL', [])
    }, 2400)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Show live transcript in input while speaking (display only, not for submission)
  useEffect(() => {
    if (transcript) setInput(transcript)
  }, [transcript])

  const askNextQuestion = async (currentStep: string, currentHistory: any[]) => {
    setLoading(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: currentStep,
          message: '',                      // empty = "give me the first question"
          conversationHistory: currentHistory,
        }),
      })
      const data = await res.json()

      const newMsg: Message = {
        id:      Date.now().toString(),
        role:    'assistant',
        content: data.response,
        agent:   currentStep,
      }

      setMessages(prev => [...prev, newMsg])

      const updatedHistory = [...currentHistory, { role: 'assistant', content: data.response }]
      setHistory(updatedHistory)
      historyRef.current = updatedHistory

      if (voiceState !== 'listening') speak(data.response)

      if (data.stepComplete) {
        const nextStep = data.nextStep
        setStep(nextStep)
        stepRef.current = nextStep
        if (nextStep !== 'DONE' && nextStep !== 'SUMMARY') {
          // Reset history so next agent starts with a clean slate
          setHistory([])
          historyRef.current = []
          setTimeout(() => askNextQuestion(nextStep, []), 600)
        } else {
          handleOnboardingComplete()
        }
      }
    } catch (err) {
      console.error('[Onboarding] Error:', err)
    }
    setLoading(false)
  }

  const sendMessage = async (text?: string) => {
    // FIX: Use passed text OR input state — never rely on stale closure
    const content = (text ?? input).trim()
    if (!content || loading) return

    const currentStep    = stepRef.current
    const currentHistory = historyRef.current

    const userMsg: Message = {
      id:      Date.now().toString(),
      role:    'user',
      content,
      agent:   currentStep,
    }

    const newHistory = [...currentHistory, { role: 'user', content }]
    setMessages(prev => [...prev, userMsg])
    setHistory(newHistory)
    historyRef.current = newHistory
    setInput('')
    setQuestionNum(q => q + 1)
    setLoading(true)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step:                currentStep,
          message:             content,
          conversationHistory: newHistory,
        }),
      })
      const data = await res.json()

      const assistantMsg: Message = {
        id:      (Date.now() + 1).toString(),
        role:    'assistant',
        content: data.response,
        agent:   data.agent ?? currentStep,
      }

      const updatedHistory = [...newHistory, { role: 'assistant', content: data.response }]
      setHistory(updatedHistory)
      historyRef.current = updatedHistory
      setMessages(prev => [...prev, assistantMsg])

      if (voiceState !== 'listening') speak(data.response)

      if (data.stepComplete) {
        const next = data.nextStep
        if (next === 'SUMMARY' || next === 'DONE') {
          handleOnboardingComplete()
        } else {
          setStep(next)
          stepRef.current = next
          // Reset history so next agent starts fresh
          setHistory([])
          historyRef.current = []
          setTimeout(() => askNextQuestion(next, []), 400)
        }
      }
    } catch (err) {
      console.error('[Onboarding] Send error:', err)
    }
    setLoading(false)
  }

  const handleOnboardingComplete = () => {
    setTimeout(() => router.push('/chat'), 1200)
  }

  const progressDots = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => i)

  return (
    <div style={{
  height: '100vh',
  overflow: 'hidden',
  background: '#0a0a0f',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: "'Sora', 'Inter', sans-serif",
  color: '#e2e2f0',
}}>
      {/* ── Top Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 28px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: 2, color: '#a5b4fc' }}>EVA</span>
          <span style={{ color: '#4a4a6a', fontSize: 14 }}>· Setting up your profile</span>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {progressDots.map(i => (
            <div key={i} style={{
              width: i < questionNum ? 24 : 8,
              height: 8, borderRadius: 4,
              background: i < questionNum ? agent.color : 'rgba(255,255,255,0.12)',
              transition: 'all 0.3s',
            }}/>
          ))}
        </div>

        <button
          onClick={() => setPrivacyMode(p => !p)}
          style={{
            background: privacyMode ? 'rgba(124,111,247,0.2)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${privacyMode ? '#7c6ff7' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 8, padding: '6px 14px', color: privacyMode ? '#a5b4fc' : '#666',
            fontSize: 13, cursor: 'pointer',
          }}>
          🔒 {privacyMode ? 'Private' : 'Privacy off'}
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Left: Agent Panel ── */}
        <div style={{
          width: 280, flexShrink: 0,
          background: 'rgba(255,255,255,0.02)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '40px 20px', gap: 20,
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: -16, borderRadius: '50%',
              background: `radial-gradient(circle, ${agent.color}33 0%, transparent 70%)`,
              animation: loading ? 'agentPulse 1.5s ease-in-out infinite' : 'none',
            }}/>
            <div style={{
              width: 110, height: 110, borderRadius: '50%',
              background: `linear-gradient(145deg, ${agent.color}22, ${agent.color}11)`,
              border: `2px solid ${agent.color}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 800, color: agent.color,
              transition: 'all 0.5s',
            }}>
              {voiceState === 'speaking' ? '🔊' : voiceState === 'listening' ? '🎙️' : agent.icon}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: agent.color }}>{agent.name}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{agent.label}</div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '16px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>Question</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>
              <span style={{ color: agent.color }}>{Math.min(questionNum + 1, TOTAL_QUESTIONS)}</span>
              <span style={{ color: '#333', fontSize: 16 }}> / {TOTAL_QUESTIONS}</span>
            </div>
          </div>
        </div>

        {/* ── Right: Chat ── */}
       <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
  flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0,
  padding: '24px 32px',
  display: 'flex', flexDirection: 'column', gap: 16,
}}>
            {messages.map(msg => {
              const msgAgent = AGENT_META[msg.agent] ?? AGENT_META.MEAL
              return (
                <div key={msg.id} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: 12,
                }}>
                  {msg.role === 'assistant' && (
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: `${msgAgent.color}22`,
                      border: `1px solid ${msgAgent.color}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: msgAgent.color,
                    }}>
                      {msgAgent.icon}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '72%',
                    background: msg.role === 'user'
                      ? `linear-gradient(135deg, ${agent.color}33, ${agent.color}22)`
                      : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${msg.role === 'user' ? agent.color + '44' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    padding: '12px 16px',
                    fontSize: 15, lineHeight: 1.6, color: '#d4d4e8',
                  }}>
                    {msg.content}
                  </div>
                </div>
              )
            })}

            {loading && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: `${agent.color}22`, border: `1px solid ${agent.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: agent.color,
                }}>
                  {agent.icon}
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px 16px 16px 4px',
                  padding: '14px 18px', display: 'flex', gap: 6, alignItems: 'center',
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: agent.color,
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{ padding: '16px 32px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {isSupported && (
                <button
                  onMouseDown={startListening}
                  onMouseUp={stopListening}
                  style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: voiceState === 'listening' ? `${agent.color}44` : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${voiceState === 'listening' ? agent.color : 'rgba(255,255,255,0.12)'}`,
                    cursor: 'pointer', fontSize: 18,
                    animation: voiceState === 'listening' ? 'agentPulse 1s ease-in-out infinite' : 'none',
                  }}>
                  🎙️
                </button>
              )}

              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type your answer or use voice…"
                style={{
                  flex: 1, padding: '12px 18px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${input ? agent.color + '66' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 12, color: '#e2e2f0', fontSize: 15,
                  outline: 'none', transition: 'border-color 0.2s',
                }}
              />

              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: input.trim()
                    ? `linear-gradient(135deg, ${agent.color}, ${agent.color}bb)`
                    : 'rgba(255,255,255,0.04)',
                  border: 'none',
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 18, transition: 'all 0.2s',
                }}>
                →
              </button>
            </div>
            <p style={{ color: '#333', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
              Hold the mic or type — both work simultaneously
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes agentPulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124,111,247,0.3); border-radius: 4px; }
      `}</style>
    </div>
  )
}
'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { ChatMessage, OnboardingStep, Agent } from '../../types'
import { MOCK_USER, ONBOARDING_QUESTIONS } from '../../lib/mockData'
import { useVoice } from '../../lib/hooks/useVoice'

type StepConfig = { key: OnboardingStep; label: string; agent: Agent; color: string }

const STEPS: StepConfig[] = [
  { key: 'MEAL', label: 'Meal & Health', agent: 'MealAgent', color: '#10B981' },
  { key: 'TASK', label: 'Work & Tasks',  agent: 'TaskAgent', color: '#F59E0B' },
  { key: 'MIS',  label: 'Alerts',        agent: 'MisAgent',  color: '#0EA5E9' },
]

const AGENT_COLORS: Record<string, string> = {
  EVA: '#6C3FF5', MealAgent: '#10B981', TaskAgent: '#F59E0B', MisAgent: '#0EA5E9',
}

const AGENT_INITIALS: Record<string, string> = {
  EVA: 'E', MealAgent: 'M', TaskAgent: 'T', MisAgent: 'A',
}

export default function OnboardingPage() {
  const router  = useRouter()
  const [currentStep, setCurrentStep]           = useState<OnboardingStep>('MEAL')
  const [messages, setMessages]                 = useState<ChatMessage[]>([])
  const [input, setInput]                       = useState('')
  const [loading, setLoading]                   = useState(false)
  const [questionNum, setQuestionNum]           = useState(1)
  const [stepIndex, setStepIndex]               = useState(0)
  const chatRef = useRef<HTMLDivElement>(null)

  const { voiceState, transcript, startListening, stopListening, speak } = useVoice((text) => {
    setInput(text)
  })

  // Kick off first question
  useEffect(() => {
    const firstQ = ONBOARDING_QUESTIONS.MEAL[0]
    setMessages([{
      id: '0', role: 'assistant', content: firstQ,
      agent: 'MealAgent', timestamp: new Date(),
    }])
  }, [])

  // Sync voice transcript to input
  useEffect(() => {
    if (transcript) setInput(transcript)
  }, [transcript])

  // Auto scroll
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const totalQuestions = STEPS.reduce((acc, s) =>
    acc + (ONBOARDING_QUESTIONS[s.key as keyof typeof ONBOARDING_QUESTIONS]?.length ?? 0), 0)

  const currentAgent = STEPS[stepIndex]?.agent ?? 'EVA'
  const agentColor   = AGENT_COLORS[currentAgent]

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setLoading(true)

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(), role: 'user',
      content: userMsg, timestamp: new Date(), isVoice: voiceState !== 'idle',
    }
    setMessages(prev => [...prev, newUserMsg])

    try {
      // TODO: call real /api/onboarding endpoint
      // const res = await fetch('/api/onboarding', {
      //   method: 'POST',
      //   body: JSON.stringify({ userId: MOCK_USER.id, step: currentStep, message: userMsg, conversationHistory: messages })
      // })
      // const data = await res.json()

      // MOCK: cycle through questions
      const stepQuestions = ONBOARDING_QUESTIONS[currentStep as keyof typeof ONBOARDING_QUESTIONS] ?? []
      const assistantMsgCount = messages.filter(m => m.role === 'assistant').length
      const nextQ = stepQuestions[assistantMsgCount]

      let responseText = ''
      let stepComplete = false

      if (!nextQ || assistantMsgCount >= stepQuestions.length - 1) {
        stepComplete = true
        const nextStepMap: Record<string, OnboardingStep> = {
          MEAL: 'TASK', TASK: 'MIS', MIS: 'SUMMARY',
        }
        const nextStep = nextStepMap[currentStep]

        if (nextStep === 'SUMMARY') {
          responseText = "Perfect! I've noted everything. EVA now has everything she needs to take care of you. Let's go to your dashboard! 🎉"
          const assistantMsg: ChatMessage = {
            id: (Date.now()+1).toString(), role: 'assistant',
            content: responseText, agent: currentAgent, timestamp: new Date(),
          }
          setMessages(prev => [...prev, assistantMsg])
          speak(responseText, currentAgent)
          setTimeout(() => router.push('/dashboard'), 2000)
          return
        }

        const nextStepConfig = STEPS.find(s => s.key === nextStep)
        responseText = `Got it! Now let me hand you over to ${nextStepConfig?.label} specialist. ${ONBOARDING_QUESTIONS[nextStep as keyof typeof ONBOARDING_QUESTIONS]?.[0] ?? ''}`
        setCurrentStep(nextStep)
        setStepIndex(prev => prev + 1)
      } else {
        responseText = nextQ
      }

      setQuestionNum(prev => prev + 1)

      const assistantMsg: ChatMessage = {
        id: (Date.now()+1).toString(), role: 'assistant',
        content: responseText, agent: currentAgent, timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMsg])
      speak(responseText, currentAgent)

    } catch (err) {
      console.error('[Onboarding Error]', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#6C3FF5,#9B72FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>E</span>
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>EVA</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>· Setting up your profile</span>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div key={i} style={{
              width: i < questionNum - 1 ? 20 : 8, height: 8, borderRadius: 4,
              background: i < questionNum - 1 ? agentColor : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s',
            }}/>
          ))}
        </div>
      </nav>

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left sidebar — agent card */}
        <div style={{ width: 280, padding: '32px 24px', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Agent avatar */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <div style={{
              position: 'absolute', inset: -12,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${agentColor}33, transparent 70%)`,
              transition: 'background 0.5s',
            }}/>
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: `linear-gradient(160deg, ${agentColor}33, ${agentColor}55)`,
              border: `2px solid ${agentColor}80`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', zIndex: 1,
            }}>
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <circle cx="30" cy="22" r="12" fill={`${agentColor}aa`}/>
                <ellipse cx="30" cy="50" rx="20" ry="14" fill={`${agentColor}77`}/>
              </svg>
            </div>
          </div>

          <h3 style={{ color: agentColor, fontWeight: 700, fontSize: 18, margin: '0 0 4px' }}>{currentAgent}</h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>Your AI assistant</p>

          {/* Question counter */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '16px 24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>QUESTION</div>
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 800 }}>
              {questionNum}<span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>/{totalQuestions}</span>
            </div>
          </div>

          {/* Step indicators */}
          <div style={{ marginTop: 24, width: '100%' }}>
            {STEPS.map((s, i) => (
              <div key={s.key} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 8, marginBottom: 6,
                background: s.key === currentStep ? `${s.color}15` : 'transparent',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: i < stepIndex ? s.color : s.key === currentStep ? s.color : 'rgba(255,255,255,0.15)',
                }}/>
                <span style={{
                  color: s.key === currentStep ? s.color : 'rgba(255,255,255,0.3)',
                  fontSize: 13, fontWeight: s.key === currentStep ? 600 : 400,
                }}>{s.label}</span>
                {i < stepIndex && <span style={{ marginLeft: 'auto', color: s.color, fontSize: 12 }}>✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                gap: 12, maxWidth: '75%',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: AGENT_COLORS[msg.agent ?? 'EVA'],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                      {AGENT_INITIALS[msg.agent ?? 'EVA']}
                    </span>
                  </div>
                )}
                <div style={{
                  padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  background: msg.role === 'user' ? 'rgba(108,63,245,0.25)' : 'rgba(255,255,255,0.07)',
                  border: msg.role === 'user' ? '1px solid rgba(108,63,245,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.9)', fontSize: 15, lineHeight: 1.6,
                }}>
                  {msg.content}
                  {msg.isVoice && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginLeft: 8 }}>🎙</span>}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 12, alignSelf: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: agentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: 12 }}>{AGENT_INITIALS[currentAgent]}</span>
                </div>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px 16px 16px 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: agentColor, animation: 'bounce 1.2s infinite', animationDelay: `${i*0.2}s` }}/>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div style={{ padding: '16px 40px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* Mic button */}
              <button
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onTouchStart={startListening}
                onTouchEnd={stopListening}
                style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: voiceState === 'listening' ? '#ef4444' : 'rgba(255,255,255,0.08)',
                  border: voiceState === 'listening' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                  animation: voiceState === 'listening' ? 'pulse 1s infinite' : 'none',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={voiceState === 'listening' ? '#fff' : 'rgba(255,255,255,0.6)'} strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                </svg>
              </button>

              {/* Text input */}
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type your answer or use voice..."
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
                  padding: '12px 16px', color: '#fff', fontSize: 15, outline: 'none',
                }}
              />

              {/* Send button */}
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: input.trim() ? agentColor : 'rgba(255,255,255,0.06)',
                  border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
              Hold the mic to speak — both work simultaneously
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes pulse  { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px } ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px }
      `}</style>
    </div>
  )
}

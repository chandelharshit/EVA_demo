'use client'
import { useState, useRef, useEffect } from 'react'
import type { ChatMessage, Agent, DashboardData, PendingAction } from '../../types'
import { MOCK_USER, MOCK_DASHBOARD, MOCK_PANTRY, MOCK_CALENDAR_EVENTS, MOCK_MOMS } from '../../lib/mockData'
import { useVoice, VoiceState } from '../../lib/hooks/useVoice'

// ── Constants ─────────────────────────────────
const AGENT_COLORS: Record<string, string> = {
  EVA: '#6C3FF5', MealAgent: '#10B981', TaskAgent: '#F59E0B', MisAgent: '#0EA5E9',
}
const AGENT_LABELS: Record<string, string> = {
  EVA: 'EVA', MealAgent: 'Meal', TaskAgent: 'Tasks', MisAgent: 'Alerts',
}
const TABS = ['Dashboard', 'Meals', 'Grocery', 'Tasks', 'Calendar', 'Settings']

// ── Sub-components ────────────────────────────

function AgentAvatar({ agent, state }: { agent: Agent; state: VoiceState }) {
  const color = AGENT_COLORS[agent]
  const rings = state === 'listening' ? '#ef4444' : state === 'speaking' ? color : state === 'processing' ? color : 'transparent'

  return (
    <div style={{ position: 'relative', width: 80, height: 80 }}>
      {state !== 'idle' && (
        <div style={{
          position: 'absolute', inset: -8, borderRadius: '50%',
          border: `2px solid ${rings}`,
          animation: state === 'speaking' ? 'avatarPulse 1s ease-in-out infinite' : state === 'listening' ? 'avatarPulse 0.6s ease-in-out infinite' : 'none',
          opacity: 0.6,
        }}/>
      )}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: `linear-gradient(160deg, ${color}22, ${color}44)`,
        border: `2px solid ${color}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="40" height="40" viewBox="0 0 60 60" fill="none">
          <circle cx="30" cy="22" r="12" fill={`${color}aa`}/>
          <ellipse cx="30" cy="50" rx="20" ry="14" fill={`${color}77`}/>
        </svg>
      </div>
      <div style={{
        position: 'absolute', bottom: -2, right: -2,
        background: color, borderRadius: 4, padding: '2px 5px',
        fontSize: 9, fontWeight: 700, color: '#fff',
      }}>{AGENT_LABELS[agent]}</div>
    </div>
  )
}

function DashboardTab({ data }: { data: DashboardData }) {
  const stressColor = data.stressLevel === 'HIGH' ? '#ef4444' : data.stressLevel === 'MEDIUM' ? '#F59E0B' : '#10B981'

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          Good morning, {MOCK_USER.name} 👋
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} · EVA has your day covered
        </p>
      </div>

      {/* Top 3 stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Energy Score', value: `${data.energyScore}/10`, sub: 'Good energy today', color: '#10B981' },
          { label: 'Stress Level', value: data.stressLevel, sub: `${data.stressPercent}% — manageable`, color: stressColor },
          { label: 'Steps Today',  value: data.stepsToday.toLocaleString(), sub: `/ ${data.stepsGoal.toLocaleString()} goal`, color: '#0EA5E9' },
        ].map(card => (
          <div key={card.label} style={{
            background: 'rgba(255,255,255,0.05)', borderRadius: 14,
            padding: '16px', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>{card.label}</div>
            <div style={{ color: card.color, fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{card.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {/* Tonight's dinner */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: '#6C3FF5', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>TONIGHT'S DINNER</div>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{data.tonightsDinner?.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            {data.tonightsDinner?.cookTime} min · {data.tonightsDinner?.calories} kcal · {data.tonightsDinner?.difficulty}
          </div>
        </div>
        {/* Time saved */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: '#10B981', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>TIME SAVED THIS WEEK</div>
          <div style={{ color: '#10B981', fontSize: 36, fontWeight: 800, marginBottom: 4 }}>{data.timeSavedHours} hrs</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>across meals, tasks & grocery</div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {/* Weather */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 10 }}>WEATHER · {data.weather.city.toUpperCase()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 32 }}>☀️</span>
            <div>
              <div style={{ color: '#fff', fontSize: 28, fontWeight: 800 }}>{data.weather.tempC}°C</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{data.weather.condition}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            <span>💧 {data.weather.humidity}%</span>
            <span>🌡 {data.weather.feelsLike}°C</span>
            <span>💨 {data.weather.windKmh} km/h</span>
          </div>
        </div>

        {/* Task alerts */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>⚠️ Task Alerts</span>
            <span style={{ background: '#ef4444', color: '#fff', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
              {data.taskAlerts.length}
            </span>
          </div>
          {data.taskAlerts.map(alert => (
            <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: alert.status === 'OVERDUE' ? '#ef4444' : alert.status === 'TODAY' ? '#F59E0B' : '#6C3FF5',
              }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{alert.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{alert.dueLabel}</div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                background: alert.status === 'OVERDUE' ? 'rgba(239,68,68,0.2)' : alert.status === 'TODAY' ? 'rgba(245,158,11,0.2)' : 'rgba(108,63,245,0.2)',
                color: alert.status === 'OVERDUE' ? '#ef4444' : alert.status === 'TODAY' ? '#F59E0B' : '#a78bfa',
              }}>{alert.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tomorrow Simulator */}
      <div style={{ background: 'rgba(108,63,245,0.08)', borderRadius: 14, padding: 16, border: '1px solid rgba(108,63,245,0.2)' }}>
        <div style={{ color: '#a78bfa', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>TOMORROW SIMULATOR</div>
        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
          Predicted energy: {data.tomorrowPrediction.energyScore}/10 · <span style={{ color: '#ef4444', fontWeight: 600 }}>{data.tomorrowPrediction.stressLevel} stress day ahead</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>{data.tomorrowPrediction.summary}</div>
      </div>
    </div>
  )
}

function TasksTab() {
  const [activeSection, setActiveSection] = useState<'schedule' | 'moms'>('schedule')
  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['schedule', 'moms'] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: activeSection === s ? '#F59E0B' : 'rgba(255,255,255,0.06)',
            color: activeSection === s ? '#000' : 'rgba(255,255,255,0.6)',
            fontWeight: 600, fontSize: 13, textTransform: 'capitalize',
          }}>{s === 'moms' ? 'Minutes of Meeting' : 'Today\'s Schedule'}</button>
        ))}
      </div>

      {activeSection === 'schedule' && (
        <div>
          {MOCK_CALENDAR_EVENTS.map(evt => {
            const start = evt.start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            const end   = evt.end.toLocaleTimeString('en-IN',   { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={evt.id} style={{
                background: 'rgba(245,158,11,0.08)', borderRadius: 12, padding: '14px 16px',
                border: '1px solid rgba(245,158,11,0.2)', marginBottom: 10,
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <div style={{ background: '#F59E0B', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, color: '#000', whiteSpace: 'nowrap' }}>
                  {start}
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{evt.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                    {start} – {end} · {evt.attendees.map(a => a.name).join(', ')}
                  </div>
                  {evt.description && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 4 }}>{evt.description}</div>}
                </div>
                <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                  {evt.provider === 'google' ? '📅 Google' : '📧 Outlook'}
                </div>
              </div>
            )
          })}
          <div style={{ background: 'rgba(245,158,11,0.05)', borderRadius: 10, padding: '12px 16px', border: '1px dashed rgba(245,158,11,0.3)', textAlign: 'center', marginTop: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Connect Google or Outlook Calendar in Settings for live events</span>
          </div>
        </div>
      )}

      {activeSection === 'moms' && (
        <div>
          {MOCK_MOMS.map(mom => (
            <div key={mom.id} style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16,
              border: '1px solid rgba(255,255,255,0.08)', marginBottom: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{mom.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{mom.meetingDate.toLocaleDateString()}</div>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>
                Attendees: {mom.attendees.join(', ')}
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ color: '#F59E0B', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Discussion Points</div>
                {mom.discussionPoints.map((d, i) => (
                  <div key={i} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, paddingLeft: 12 }}>• {d}</div>
                ))}
              </div>
              <div>
                <div style={{ color: '#10B981', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Action Items</div>
                {mom.actionItems.map((a, i) => (
                  <div key={i} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, paddingLeft: 12 }}>
                    • <strong style={{ color: '#F59E0B' }}>{a.owner}</strong>: {a.task} {a.dueDate && `— due ${a.dueDate}`}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PantryTab() {
  const lowStock = MOCK_PANTRY.filter(p => p.quantity < p.lowThreshold)
  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      {lowStock.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 10, padding: 12, border: '1px solid rgba(239,68,68,0.3)', marginBottom: 16, color: '#ef4444', fontSize: 13 }}>
          ⚠️ Low stock: {lowStock.map(p => p.itemName).join(', ')}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        {MOCK_PANTRY.map(item => {
          const isLow = item.quantity < item.lowThreshold
          return (
            <div key={item.id} style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px',
              border: `1px solid ${isLow ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, textTransform: 'capitalize' }}>{item.itemName}</span>
              <span style={{ color: isLow ? '#ef4444' : '#10B981', fontSize: 13, fontWeight: 600 }}>
                {item.quantity}{item.unit}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SettingsTab() {
  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 20 }}>Integrations</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Google Calendar */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '16px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>📅</span>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Google Calendar</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Sync meetings and events</div>
            </div>
          </div>
          {/* TODO: onClick → trigger Google OAuth flow → window.location.href = '/api/auth/google' */}
          <button style={{ background: '#4285F4', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Connect
          </button>
        </div>

        {/* Outlook Calendar */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '16px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>📧</span>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Outlook Calendar</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Sync via Microsoft Graph</div>
            </div>
          </div>
          {/* TODO: onClick → trigger Outlook OAuth flow → window.location.href = '/api/auth/outlook' */}
          <button style={{ background: '#0078D4', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Connect
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard Page ───────────────────────
export default function DashboardPage() {
  const [activeTab, setActiveTab]               = useState('Dashboard')
  const [messages, setMessages]                 = useState<ChatMessage[]>([])
  const [input, setInput]                       = useState('')
  const [loading, setLoading]                   = useState(false)
  const [activeAgent, setActiveAgent]           = useState<Agent>('EVA')
  const [privacyMode, setPrivacyMode]           = useState(false)
  const [ventMode, setVentMode]                 = useState(false)
  const [pendingAction, setPendingAction]       = useState<PendingAction | null>(null)
  const chatRef   = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  const { voiceState, transcript, isSupported, startListening, stopListening, speak, cancelSpeaking } = useVoice((text) => {
    sendMessage(text)
  })

  useEffect(() => {
    if (transcript) setInput(transcript)
  }, [transcript])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function sendMessage(overrideText?: string) {
    const text = overrideText ?? input.trim()
    if (!text || loading) return
    setInput('')
    setLoading(true)
    cancelSpeaking()

    const userMsg: ChatMessage = {
      id: Date.now().toString(), role: 'user',
      content: text, timestamp: new Date(), isVoice: !!overrideText,
    }
    setMessages(prev => [...prev, userMsg])

    try {
      // TODO: call real /api/chat endpoint
      // const res = await fetch('/api/chat', {
      //   method: 'POST', headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ message: text, userId: MOCK_USER.id, conversationHistory: messages, privacyMode, isVoice: !!overrideText })
      // })
      // const data = await res.json()

      // MOCK response — simulates agent routing
      const mockResponse = getMockResponse(text, ventMode)
      setActiveAgent(mockResponse.handledBy)

      if (mockResponse.pendingAction) setPendingAction(mockResponse.pendingAction)

      const assistantMsg: ChatMessage = {
        id: (Date.now()+1).toString(), role: 'assistant',
        content: mockResponse.response, agent: mockResponse.handledBy,
        timestamp: new Date(), pendingAction: mockResponse.pendingAction,
      }
      setMessages(prev => [...prev, assistantMsg])

      // Speak the response
      speak(mockResponse.response, mockResponse.handledBy)

    } catch (err) {
      console.error('[Chat Error]', err)
    } finally {
      setLoading(false)
    }
  }

  async function confirmCooking() {
    if (!pendingAction?.meal) return
    // TODO: call real /api/confirm-cooking
    // const res = await fetch('/api/confirm-cooking', { method: 'POST', body: JSON.stringify({ userId: MOCK_USER.id, meal: pendingAction.meal, ingredientsToDeduct: pendingAction.ingredientsToDeduct }) })
    const confirmMsg: ChatMessage = {
      id: Date.now().toString(), role: 'assistant',
      content: `✅ Great! I've updated your pantry for ${pendingAction.meal}. Enjoy your meal! 🍽️`,
      agent: 'MealAgent', timestamp: new Date(),
    }
    setMessages(prev => [...prev, confirmMsg])
    setPendingAction(null)
    speak(confirmMsg.content, 'MealAgent')
  }

  const tabContent: Record<string, React.ReactNode> = {
    Dashboard: <DashboardTab data={MOCK_DASHBOARD}/>,
    Tasks:     <TasksTab/>,
    Grocery:   <PantryTab/>,
    Settings:  <SettingsTab/>,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', height: '100vh' }}>

      {/* Top nav */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: activeTab === tab ? '#6C3FF5' : 'transparent',
            color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.4)',
            fontWeight: activeTab === tab ? 600 : 400, fontSize: 13,
            transition: 'all 0.2s',
          }}>{tab}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>📍 {MOCK_DASHBOARD.weather.city}</span>
          <span style={{ color: '#F59E0B', fontSize: 12 }}>☀️ {MOCK_DASHBOARD.weather.tempC}°C</span>

          {/* Privacy toggle */}
          <button onClick={() => setPrivacyMode(p => !p)} style={{
            background: privacyMode ? 'rgba(108,63,245,0.3)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${privacyMode ? 'rgba(108,63,245,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 8, padding: '5px 10px', color: privacyMode ? '#a78bfa' : 'rgba(255,255,255,0.4)',
            cursor: 'pointer', fontSize: 12,
          }}>
            {privacyMode ? '🔒 Private' : '🔓 Normal'}
          </button>

          {/* User avatar */}
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#6C3FF5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{MOCK_USER.name[0]}</span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left sidebar — EVA + chat */}
        <div style={{ width: 320, borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          {/* Agent avatar area */}
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <AgentAvatar agent={activeAgent} state={voiceState}/>
            <div style={{ color: AGENT_COLORS[activeAgent], fontWeight: 700, fontSize: 14 }}>{activeAgent}</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
              {voiceState === 'listening' ? '🎙 Listening...' : voiceState === 'speaking' ? '🔊 Speaking...' : voiceState === 'processing' ? '⏳ Thinking...' : 'Always here to help'}
            </div>

            {/* Vent mode toggle */}
            <button onClick={() => setVentMode(v => !v)} style={{
              background: ventMode ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${ventMode ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 8, padding: '5px 12px', color: ventMode ? '#ef4444' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', fontSize: 12, fontWeight: 500,
            }}>
              {ventMode ? '❤️ Vent Mode ON' : '💬 Vent Mode'}
            </button>
          </div>

          {/* Chat messages */}
          <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {messages.length === 0 && (
              <div style={{ padding: '20px 12px', textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Ask EVA anything...</p>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {["What's for dinner tonight?", "What's on my calendar today?", "Remind me at 5pm to call mom"].map(s => (
                    <button key={s} onClick={() => sendMessage(s)} style={{
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8, padding: '7px 10px', color: 'rgba(255,255,255,0.5)',
                      cursor: 'pointer', fontSize: 12, textAlign: 'left',
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} style={{ marginBottom: 8 }}>
                {msg.role === 'assistant' && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: AGENT_COLORS[msg.agent ?? 'EVA'],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: '#fff',
                    }}>{msg.agent?.[0]}</div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '4px 12px 12px 12px', padding: '8px 12px', fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, border: '1px solid rgba(255,255,255,0.07)' }}>
                      {msg.content}
                      {/* Confirm cooking button */}
                      {msg.pendingAction?.type === 'CONFIRM_COOKING' && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                          <button onClick={confirmCooking} style={{ background: '#10B981', border: 'none', borderRadius: 6, padding: '5px 10px', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            🍲 Yes, cooking this!
                          </button>
                          <button onClick={() => setPendingAction(null)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, padding: '5px 10px', color: 'rgba(255,255,255,0.6)', fontSize: 11, cursor: 'pointer' }}>
                            Suggest another
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {msg.role === 'user' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                    <div style={{ background: 'rgba(108,63,245,0.2)', borderRadius: '12px 4px 12px 12px', padding: '8px 12px', fontSize: 13, color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(108,63,245,0.25)' }}>
                      {msg.content}
                      {msg.isVoice && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginLeft: 4 }}>🎙</span>}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: AGENT_COLORS[activeAgent], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700 }}>{activeAgent[0]}</div>
                <div style={{ display: 'flex', gap: 4, padding: '8px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px 12px 12px 12px' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: AGENT_COLORS[activeAgent], animation: 'bounce 1.2s infinite', animationDelay: `${i*0.2}s` }}/>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {isSupported && (
                <button
                  onMouseDown={startListening}
                  onMouseUp={stopListening}
                  onTouchStart={startListening}
                  onTouchEnd={stopListening}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: voiceState === 'listening' ? '#ef4444' : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${voiceState === 'listening' ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: voiceState === 'listening' ? 'micPulse 0.8s infinite' : 'none',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={voiceState === 'listening' ? '#fff' : 'rgba(255,255,255,0.5)'} strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                  </svg>
                </button>
              )}
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={ventMode ? "Just talk, I'm here... 💙" : "Ask EVA anything..."}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                  padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none',
                }}
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: input.trim() ? AGENT_COLORS[activeAgent] : 'rgba(255,255,255,0.05)',
                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right main area — tab content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {tabContent[activeTab] ?? (
            <div style={{ padding: 24, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              Coming soon: {activeTab}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes bounce    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes avatarPulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.1);opacity:1} }
        @keyframes micPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:3px } ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px }
      `}</style>
    </div>
  )
}

// ── Mock response generator (replace with real API) ──
function getMockResponse(message: string, ventMode: boolean): { response: string; handledBy: Agent; pendingAction?: PendingAction } {
  const lower = message.toLowerCase()

  if (ventMode) {
    return {
      response: "I hear you. That sounds really tough, and it's completely okay to feel this way. I'm here with you — no advice, just listening. 💙",
      handledBy: 'EVA',
    }
  }

  if (lower.includes('dinner') || lower.includes('cook') || lower.includes('meal') || lower.includes('food') || lower.includes('eat')) {
    return {
      response: "Based on what's in your pantry, I'd suggest Palak Paneer tonight — you have everything needed! 🥘\n✅ Palak (200g) ✅ Paneer (250g) ✅ Onions ✅ Spices\n⏱ 25 min · 380 kcal · Easy\n\nWant to cook this tonight? I'll update your pantry!",
      handledBy: 'MealAgent',
      pendingAction: {
        type: 'CONFIRM_COOKING',
        meal: 'Palak Paneer',
        ingredientsToDeduct: [
          { item: 'palak',  qty: 200, unit: 'g',       available: true },
          { item: 'paneer', qty: 200, unit: 'g',       available: true },
          { item: 'onion',  qty: 1,   unit: 'pieces',  available: true },
        ],
      },
    }
  }

  if (lower.includes('meeting') || lower.includes('calendar') || lower.includes('schedule') || lower.includes('task') || lower.includes('mom')) {
    return {
      response: "You have 3 meetings today:\n• Sprint Standup at 10:00 AM (30 min)\n• Product Review at 3:00 PM (1 hr)\n• 1:1 with Manager at 5:00 PM (30 min)\n\nHeads up — back-to-back afternoon. Want me to generate MOM for your standup?",
      handledBy: 'TaskAgent',
    }
  }

  if (lower.includes('remind') || lower.includes('alert') || lower.includes('notification')) {
    return {
      response: "I'll set that reminder for you! 🔔 I'll make sure it's outside your quiet hours (9PM–7AM). Your school pickup reminder is still active at 3:30PM today.",
      handledBy: 'MisAgent',
      pendingAction: { type: 'CONFIRM_REMINDER', reminder: { title: message, isActive: true } },
    }
  }

  return {
    response: "I'm here to help with meals, tasks, and reminders. What's on your mind today? You can also switch to Vent Mode if you just want to talk. 💙",
    handledBy: 'EVA',
  }
}

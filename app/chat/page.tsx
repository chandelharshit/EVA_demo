'use client'

import { useState, useRef, useEffect } from 'react'
import { useVoice } from '../../lib/hooks/useVoice'
import { MOCK_DASHBOARD, MOCK_PANTRY, MOCK_MOMS } from '../../lib/mockData'
import type { ChatMessage, AgentName, DashboardData, PantryItem } from '../../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const AGENT_COLORS: Record<AgentName | 'EVA', string> = {
  EVA:       '#7c6ff7',
  MealAgent: '#10b981',
  TaskAgent: '#f59e0b',
  MisAgent:  '#0ea5e9',
}

const AGENT_ICONS: Record<string, string> = {
  EVA:       'E',
  MealAgent: 'M',
  TaskAgent: 'T',
  MisAgent:  'A',
}

type TabName = 'Dashboard' | 'Meals' | 'Grocery' | 'Tasks' | 'Health' | 'Settings'

// ─── Main Chat Page ───────────────────────────────────────────────────────────

export default function ChatPage() {
  const [activeTab, setActiveTab]       = useState<TabName>('Dashboard')
  const [messages, setMessages]         = useState<ChatMessage[]>([
    {
      id: '0', role: 'assistant',
      content: "Good morning! I'm EVA 👋 I have your day covered. You have Sprint Standup at 10am and Product Review at 3pm. Want me to suggest tonight's dinner based on your pantry?",
      agent: 'EVA', timestamp: new Date().toISOString(),
    }
  ])
  const [input, setInput]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [privacyMode, setPrivacyMode]   = useState(false)
  const [pantry, setPantry]             = useState<PantryItem[]>(MOCK_PANTRY)
  const [dashboard]                     = useState<DashboardData>(MOCK_DASHBOARD)
  const [currentAgent, setCurrentAgent] = useState<AgentName>('EVA')
  const [justVentMode, setJustVentMode] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  const { voiceState, transcript, startListening, stopListening, speak, cancelSpeech, isSupported } =
    useVoice((text) => { setInput(text); setTimeout(() => sendMessage(text), 200) })

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (transcript) setInput(transcript) }, [transcript])

  // ── Send message ────────────────────────────────────────────────────────────

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(), role: 'user',
      content, timestamp: new Date().toISOString(),
    }

    const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const finalContent = justVentMode
        ? `[VENT MODE - respond with empathy only, do not try to solve] ${content}`
        : content

      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:             finalContent,
          userId:              'priya_001',
          conversationHistory: history,
          privacyMode,
        }),
      })

      const data = await res.json()
      const agent = (data.handledBy ?? 'EVA') as AgentName
      setCurrentAgent(agent)

      const aiMsg: ChatMessage = {
        id:            (Date.now() + 1).toString(),
        role:          'assistant',
        content:       data.response,
        agent,
        timestamp:     new Date().toISOString(),
        pendingAction: data.pendingAction,
      }

      setMessages(prev => [...prev, aiMsg])

      // Proactive suggestion from EVA
      if (data.proactiveSuggestion) {
        setMessages(prev => [...prev, {
          id:        (Date.now() + 2).toString(),
          role:      'assistant',
          content:   data.proactiveSuggestion,
          agent:     'EVA',
          timestamp: new Date().toISOString(),
        }])
      }

      // Low stock alerts from MisAgent
      if (data.lowStockAlerts?.length > 0) {
        setMessages(prev => [...prev, {
          id:        (Date.now() + 3).toString(),
          role:      'assistant',
          content:   `🛒 Low stock: ${data.lowStockAlerts.join(', ')}. Want me to add these to your grocery list?`,
          agent:     'MisAgent',
          timestamp: new Date().toISOString(),
        }])
      }

      // Auto-speak response
      if (voiceState !== 'listening') speak(data.response)

    } catch (err) {
      console.error('[Chat] Error:', err)
      setMessages(prev => [...prev, {
        id:        (Date.now() + 1).toString(),
        role:      'assistant',
        content:   'Something went wrong. Please try again.',
        agent:     'EVA',
        timestamp: new Date().toISOString(),
      }])
    }
    setLoading(false)
  }

  // ── Confirm cooking action ───────────────────────────────────────────────────

  const confirmCooking = async (meal: string, ingredients: any[]) => {
    setLoading(true)
    try {
      const res = await fetch('/api/confirm-cooking', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: 'priya_001', meal, ingredientsToDeduct: ingredients }),
      })
      const data = await res.json()

      setPantry(data.updatedPantry)

      setMessages(prev => [...prev, {
        id:        Date.now().toString(),
        role:      'assistant',
        content:   `✅ ${data.message}`,
        agent:     'MealAgent',
        timestamp: new Date().toISOString(),
      }])
    } catch (err) {
      console.error('[ConfirmCooking] Error:', err)
    }
    // Remove pending action from the message
    setMessages(prev => prev.map(m => ({ ...m, pendingAction: undefined })))
    setLoading(false)
  }

  const agentColor = AGENT_COLORS[currentAgent]

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#0a0a0f', color: '#e2e2f0',
      fontFamily: "'Sora', 'Inter', sans-serif",
      overflow: 'hidden',
    }}>
      {/* ── Top Nav ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', gap: 0,
        padding: '0 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        height: 52, flexShrink: 0,
      }}>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: 2, color: '#a5b4fc', marginRight: 32 }}>EVA</span>

        {(['Dashboard','Meals','Grocery','Tasks','Health','Settings'] as TabName[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0 16px', height: '100%', background: 'none',
              border: 'none', borderBottom: `2px solid ${activeTab === tab ? '#7c6ff7' : 'transparent'}`,
              color: activeTab === tab ? '#a5b4fc' : '#555',
              fontWeight: activeTab === tab ? 600 : 400,
              fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}>
            {tab}
          </button>
        ))}

        {/* Right side controls */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#555', fontSize: 13 }}>Wed, 18 Mar</span>
          <span style={{ color: '#7c6ff7', fontSize: 13, fontWeight: 600 }}>12:17 am</span>
          <span style={{ color: '#555', fontSize: 13 }}>📍 New Delhi</span>
          <span style={{ color: '#555', fontSize: 13 }}>☀️ 28°C</span>

          {/* Privacy toggle */}
          <button
            onClick={() => setPrivacyMode(p => !p)}
            title={privacyMode ? 'Privacy mode ON' : 'Privacy mode OFF'}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: privacyMode ? 'rgba(124,111,247,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${privacyMode ? '#7c6ff7' : 'rgba(255,255,255,0.1)'}`,
              cursor: 'pointer', fontSize: 16,
            }}>
            🔒
          </button>

          {/* User avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c6ff7, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, color: '#fff',
          }}>H</div>
        </div>
      </nav>

      {privacyMode && (
        <div style={{
          background: 'rgba(124,111,247,0.1)', borderBottom: '1px solid rgba(124,111,247,0.3)',
          padding: '8px 24px', fontSize: 13, color: '#a5b4fc', textAlign: 'center',
        }}>
          🔒 Privacy mode — this session won't be remembered
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ── Left: EVA Avatar + Chat ── */}
        <div style={{
          width: 260, flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          background: 'rgba(255,255,255,0.01)',
        }}>
          {/* Avatar */}
          <div style={{ padding: '24px 20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{
                position: 'absolute', inset: -12,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${agentColor}33, transparent 70%)`,
                animation: voiceState === 'speaking' ? 'evaPulse 1.5s ease-in-out infinite' : 'none',
              }}/>
              <div style={{
                width: 100, height: 100, borderRadius: '50%',
                background: `linear-gradient(145deg, ${agentColor}22, #1a1a2e)`,
                border: `2px solid ${agentColor}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, fontWeight: 800, color: agentColor, transition: 'all 0.5s',
                cursor: voiceState === 'speaking' ? 'pointer' : 'default',
              }}
              onClick={voiceState === 'speaking' ? cancelSpeech : undefined}>
                {voiceState === 'speaking' ? '🔊' : voiceState === 'listening' ? '🎙️' : voiceState === 'processing' ? '⟳' : AGENT_ICONS[currentAgent]}
              </div>
            </div>
            <div style={{ marginTop: 12, fontWeight: 700, color: agentColor, transition: 'color 0.4s' }}>{currentAgent}</div>
            <div style={{ fontSize: 12, color: '#444', marginTop: 2 }}>Always here to help</div>
          </div>

          {/* Mini chat history in sidebar */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.filter(m => m.role === 'assistant').slice(-4).map(m => (
              <div key={m.id} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '10px 12px',
                fontSize: 12, color: '#666', lineHeight: 1.5,
              }}>
                {(m.content ?? '').slice(0, 80)}{(m.content?.length ?? 0) > 80 ? '…' : ''}
              </div>
            ))}
          </div>

          {/* Sidebar input */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask EVA anything…"
                style={{
                  flex: 1, padding: '10px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, color: '#e2e2f0', fontSize: 13,
                  outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button
                onClick={() => sendMessage()}
                style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: input.trim() ? `linear-gradient(135deg, ${agentColor}, ${agentColor}bb)` : 'rgba(255,255,255,0.04)',
                  border: 'none', cursor: 'pointer', fontSize: 14,
                }}>→</button>
            </div>
          </div>
        </div>

        {/* ── Right: Main Content Area ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {activeTab === 'Dashboard' && (
            <DashboardView
              dashboard={dashboard}
              messages={messages}
              loading={loading}
              onConfirmCooking={confirmCooking}
              justVentMode={justVentMode}
              setJustVentMode={setJustVentMode}
            />
          )}

          {activeTab === 'Tasks' && <TasksView />}
          {activeTab === 'Grocery' && <GroceryView pantry={pantry} />}
          {activeTab === 'Meals' && <MealsView />}
          {activeTab === 'Settings' && <SettingsView />}
          {activeTab === 'Health' && (
            <div style={{ color: '#555', fontSize: 15, marginTop: 40, textAlign: 'center' }}>
              Health dashboard coming soon 🏃
            </div>
          )}
        </div>
      </div>

      {/* ── Voice hint ── */}
      {isSupported && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end',
        }}>
          <button
            onMouseDown={startListening}
            onMouseUp={stopListening}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: voiceState === 'listening'
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : `linear-gradient(135deg, ${agentColor}, ${agentColor}bb)`,
              border: 'none', cursor: 'pointer', fontSize: 22,
              boxShadow: voiceState === 'listening' ? '0 0 20px rgba(239,68,68,0.5)' : `0 0 16px ${agentColor}44`,
              animation: voiceState === 'listening' ? 'evaPulse 1s ease-in-out infinite' : 'none',
              transition: 'all 0.3s',
            }}>
            🎙️
          </button>
          {voiceState === 'listening' && (
            <div style={{
              background: 'rgba(10,10,15,0.9)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#a5b4fc', maxWidth: 200,
            }}>
              {transcript || 'Listening…'}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes evaPulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124,111,247,0.3); border-radius: 4px; }
      `}</style>
    </div>
  )
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardView({ dashboard, messages, loading, onConfirmCooking, justVentMode, setJustVentMode }: any) {
  const statusColor = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444' }[dashboard.stress_level]

  return (
    <>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Good morning, Harshit 👋</h2>
        <p style={{ color: '#555', fontSize: 14, marginTop: 4 }}>Wed, 18 Mar · EVA has your day covered</p>
      </div>

      {/* Top metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <MetricCard label="Energy Score"  value={`${dashboard.energy_score} / 10`} sub="Good energy today"   color="#10b981"/>
        <MetricCard label="Stress Level"  value={dashboard.stress_level}           sub={`${dashboard.stress_percent}% — manageable`} color={statusColor}/>
        <MetricCard label="Steps Today"   value={dashboard.steps_today.toLocaleString()} sub={`/ ${dashboard.steps_goal.toLocaleString()} goal`} color="#0ea5e9"/>
      </div>

      {/* Dinner + Time saved */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ color: '#7c6ff7', fontSize: 13, fontWeight: 600 }}>Tonight's Dinner</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>{dashboard.tonight_dinner.name}</div>
          <div style={{ color: '#555', fontSize: 13, marginTop: 4 }}>
            {dashboard.tonight_dinner.time_mins} min · {dashboard.tonight_dinner.calories} kcal · {dashboard.tonight_dinner.difficulty}
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ color: '#7c6ff7', fontSize: 13, fontWeight: 600 }}>Time Saved This Week</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#10b981', marginTop: 8 }}>{dashboard.time_saved_hours} hrs</div>
          <div style={{ color: '#555', fontSize: 13, marginTop: 4 }}>across meals, tasks & grocery</div>
        </div>
      </div>

      {/* Weather + Task Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 14 }}>
        {/* Weather */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ color: '#555', fontSize: 11, letterSpacing: 1 }}>WEATHER · {dashboard.weather.city.toUpperCase()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
            <span style={{ fontSize: 40 }}>☀️</span>
            <div>
              <div style={{ fontSize: 36, fontWeight: 800 }}>{dashboard.weather.temp}°C</div>
              <div style={{ color: '#555', fontSize: 14 }}>{dashboard.weather.condition}</div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 13, color: '#555', lineHeight: 1.8 }}>
              <div>💧 {dashboard.weather.humidity}%</div>
              <div>🌡️ Feels {dashboard.weather.feels_like}°C</div>
              <div>💨 {dashboard.weather.wind} km/h</div>
            </div>
          </div>
        </div>

        {/* Task Alerts */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>⚠️ Task Alerts</span>
            <span style={{
              background: '#ef4444', color: '#fff', borderRadius: '50%',
              width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
            }}>{dashboard.task_alerts.length}</span>
          </div>
          {dashboard.task_alerts.map((alert: any) => {
            const badgeColor = { OVERDUE: '#ef4444', TODAY: '#f59e0b', UPCOMING: '#7c6ff7' }[alert.status]
            return (
              <div key={alert.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: badgeColor, display: 'inline-block' }}/>
                    <span style={{ fontSize: 13 }}>{alert.title}</span>
                    <span style={{ background: `${badgeColor}22`, color: badgeColor, fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>{alert.status}</span>
                  </div>
                  <div style={{ color: '#555', fontSize: 11, marginLeft: 16 }}>{alert.detail}</div>
                </div>
                <button style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, padding: '4px 10px', color: '#aaa', fontSize: 11, cursor: 'pointer',
                }}>{alert.action}</button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chat messages (last 6) */}
      <ChatThread messages={messages} loading={loading} onConfirmCooking={onConfirmCooking}/>

      {/* Tomorrow Simulator */}
      <div style={{
        background: 'rgba(124,111,247,0.06)', border: '1px solid rgba(124,111,247,0.2)',
        borderRadius: 14, padding: '16px 20px',
      }}>
        <div style={{ color: '#7c6ff7', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Tomorrow Simulator</div>
        <div style={{ fontSize: 14, color: '#aaa', lineHeight: 1.7 }}>{dashboard.tomorrow_prediction}</div>
      </div>

      {/* Just Vent Mode toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => setJustVentMode((v: boolean) => !v)}
          style={{
            padding: '8px 18px', borderRadius: 20,
            background: justVentMode ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${justVentMode ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
            color: justVentMode ? '#ef4444' : '#555', cursor: 'pointer', fontSize: 13,
          }}>
          {justVentMode ? '❤️ Vent mode ON — I\'m listening' : '🗣️ Just Vent Mode'}
        </button>
        <span style={{ fontSize: 12, color: '#444' }}>EVA will only listen, not solve</span>
      </div>
    </>
  )
}

// ─── Chat Thread ──────────────────────────────────────────────────────────────

function ChatThread({ messages, loading, onConfirmCooking }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {messages.slice(-6).map((msg: ChatMessage) => {
        const agentColor = AGENT_COLORS[(msg.agent ?? 'EVA') as AgentName]
        return (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            gap: 10, alignItems: 'flex-start',
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: `${agentColor}22`, border: `1px solid ${agentColor}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: agentColor,
              }}>
                {AGENT_ICONS[msg.agent ?? 'EVA']}
              </div>
            )}
            <div style={{ maxWidth: '75%' }}>
              {msg.role === 'assistant' && msg.agent !== 'EVA' && (
                <div style={{ fontSize: 11, color: agentColor, marginBottom: 4, fontWeight: 600 }}>{msg.agent}</div>
              )}
              <div style={{
                background: msg.role === 'user'
                  ? 'rgba(124,111,247,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(124,111,247,0.3)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                padding: '10px 14px', fontSize: 14, lineHeight: 1.65, color: '#d4d4e8',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>

              {/* Pending action button */}
              {msg.pendingAction?.type === 'CONFIRM_COOKING' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => onConfirmCooking(msg.pendingAction.meal, msg.pendingAction.ingredientsToDeduct)}
                    style={{
                      padding: '8px 18px', borderRadius: 20,
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    }}>
                    ✅ Cook {msg.pendingAction.meal} tonight
                  </button>
                  <button
                    onClick={() => {}}
                    style={{
                      padding: '8px 14px', borderRadius: 20,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#666', fontSize: 13, cursor: 'pointer',
                    }}>
                    Not tonight
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {loading && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(124,111,247,0.15)', border: '1px solid rgba(124,111,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#7c6ff7' }}>E</div>
          <div style={{ display: 'flex', gap: 5, padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '14px 14px 14px 4px', border: '1px solid rgba(255,255,255,0.07)' }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c6ff7', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}/>)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

function TasksView() {
  const [moms] = useState(MOCK_MOMS)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>📋 Tasks & Meetings</h3>

      {/* Calendar connection prompt */}
      <div style={{
        background: 'rgba(124,111,247,0.08)', border: '1px solid rgba(124,111,247,0.25)',
        borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Connect your calendar</div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Sync Google or Outlook for live meeting data</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ padding: '8px 16px', borderRadius: 8, background: '#fff', border: 'none', fontSize: 13, fontWeight: 600, color: '#111', cursor: 'pointer' }}>
            Google Calendar
          </button>
          <button style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 13, color: '#aaa', cursor: 'pointer' }}>
            Outlook
          </button>
        </div>
      </div>

      {/* MOMs */}
      <div>
        <h4 style={{ color: '#7c6ff7', fontSize: 13, fontWeight: 600, letterSpacing: 1, margin: '0 0 12px' }}>RECENT MINUTES OF MEETING</h4>
        {moms.map(mom => (
          <div key={mom.id} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '16px 18px', marginBottom: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{mom.title}</div>
                <div style={{ color: '#555', fontSize: 13, marginTop: 2 }}>
                  {new Date(mom.meeting_date).toLocaleDateString()} · {mom.attendees.map(a => a.name).join(', ')}
                </div>
              </div>
              <span style={{ color: '#10b981', fontSize: 12, background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: 6 }}>AI Generated</span>
            </div>
            <div style={{ marginTop: 12, fontSize: 13, color: '#888' }}>{mom.discussion}</div>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: '#7c6ff7', fontWeight: 600, marginBottom: 6 }}>ACTION ITEMS</div>
              {mom.action_items.map((item, i) => (
                <div key={i} style={{ fontSize: 13, color: '#aaa', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: '#f59e0b' }}>{item.owner}</span> → {item.task} → <span style={{ color: '#555' }}>by {item.due_date}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Grocery / Pantry Tab ─────────────────────────────────────────────────────

function GroceryView({ pantry }: { pantry: PantryItem[] }) {
  const lowStock = pantry.filter(p => p.quantity <= p.low_threshold)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🛒 Pantry & Grocery</h3>

      {lowStock.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '12px 16px' }}>
          <div style={{ color: '#ef4444', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>⚠️ Low Stock Alert</div>
          {lowStock.map(p => (
            <div key={p.id} style={{ fontSize: 13, color: '#aaa', padding: '3px 0' }}>
              {p.item_name} — only {p.quantity}{p.unit} left
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {pantry.map(item => {
          const isLow   = item.quantity <= item.low_threshold
          const percent = Math.min(100, (item.quantity / (item.low_threshold * 3)) * 100)
          return (
            <div key={item.id} style={{
              background: 'rgba(255,255,255,0.03)', border: `1px solid ${isLow ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 10, padding: '12px 14px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{item.item_name}</span>
                <span style={{ fontSize: 13, color: isLow ? '#ef4444' : '#aaa' }}>{item.quantity}{item.unit}</span>
              </div>
              <div style={{ marginTop: 8, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${percent}%`,
                  background: isLow ? '#ef4444' : '#10b981',
                  transition: 'width 0.5s',
                }}/>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Meals Tab ────────────────────────────────────────────────────────────────

function MealsView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🍽️ Meal Planner</h3>
      <div style={{ color: '#555', fontSize: 14 }}>Ask EVA to suggest meals or plan your week. Your meal history and preferences are used automatically.</div>
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: '16px 18px',
      }}>
        <div style={{ color: '#10b981', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>LIKED MEALS</div>
        {['Palak Paneer', 'Dal Tadka', 'Pasta Arrabbiata', 'Khichdi', 'Egg Bhurji'].map(meal => (
          <div key={meal} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
            fontSize: 14, color: '#d4d4e8',
          }}>
            <span>{meal}</span>
            <span style={{ color: '#f59e0b' }}>★★★★★</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>⚙️ Settings</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: 'Connect Google Calendar', sub: 'Sync meetings and events', action: 'Connect', color: '#7c6ff7' },
          { label: 'Connect Outlook Calendar', sub: 'Sync Microsoft Teams meetings', action: 'Connect', color: '#0ea5e9' },
          { label: 'ElevenLabs Voice', sub: 'EVA voice for TTS — add API key', action: 'Configure', color: '#10b981' },
          { label: 'Privacy Mode', sub: 'Sessions won\'t be saved to memory', action: 'Toggle', color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '14px 18px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{s.sub}</div>
            </div>
            <button style={{
              padding: '7px 16px', borderRadius: 8,
              background: `${s.color}22`,
              border: `1px solid ${s.color}44`,
              color: s.color, fontSize: 13, cursor: 'pointer', fontWeight: 600,
            }}>{s.action}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Shared MetricCard ────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '18px 20px',
    }}>
      <div style={{ color: '#555', fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, marginTop: 8, lineHeight: 1 }}>{value}</div>
      <div style={{ color: '#555', fontSize: 13, marginTop: 6 }}>{sub}</div>
    </div>
  )
}

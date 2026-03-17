import type { UserHealthProfile } from '../types'

// ─── PII Scrubber ─────────────────────────────────────────────────────────────
// Called on EVERY user message before it reaches any LLM API call
// REAL: extend with more patterns based on Indian PII (Aadhaar, PAN, etc.)

export function scrubPII(text: string, profile?: UserHealthProfile): string {
  let clean = text

  // Phone numbers (10-digit Indian mobile)
  clean = clean.replace(/\b[6-9]\d{9}\b/g, '[PHONE]')

  // Email addresses
  clean = clean.replace(/\b[\w.%+-]+@[\w.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]')

  // Aadhaar (12 digits)
  clean = clean.replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, '[AADHAAR]')

  // PAN card (ABCDE1234F format)
  clean = clean.replace(/\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g, '[PAN]')

  // Family member names from profile
  if (profile?.family_members) {
    const names = profile.family_members.map(m => m.name).filter(Boolean)
    names.forEach(name => {
      const regex = new RegExp(`\\b${name}\\b`, 'gi')
      clean = clean.replace(regex, '[FAMILY_MEMBER]')
    })
  }

  return clean
}

// ─── Content Extractor ───────────────────────────────────────────────────────
// Gemini returns content as string OR array of content blocks
// Always call this before using .includes() or rendering

export function extractContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((block) => (typeof block === 'string' ? block : (block as any)?.text ?? ''))
      .join('')
  }
  return ''
}

// ─── Quiet Hours Check ────────────────────────────────────────────────────────
// MisAgent uses this before firing any alert

export function isQuietHours(quietStart: string, quietEnd: string): boolean {
  const now = new Date()
  const [sh, sm] = quietStart.split(':').map(Number)
  const [eh, em] = quietEnd.split(':').map(Number)

  const nowMins   = now.getHours() * 60 + now.getMinutes()
  const startMins = sh * 60 + sm
  const endMins   = eh * 60 + em

  // Handle overnight quiet hours (e.g. 21:00 - 07:00)
  if (startMins > endMins) {
    return nowMins >= startMins || nowMins <= endMins
  }
  return nowMins >= startMins && nowMins <= endMins
}

// ─── Day Name Helper ──────────────────────────────────────────────────────────

export function getTodayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' })
}

// ─── Token Refresh ────────────────────────────────────────────────────────────
// REAL: called before every calendar API call
// REAL: fetch from supabase user_integrations, refresh if expired, store new tokens

export async function getValidCalendarToken(
  userId: string,
  provider: 'google' | 'outlook'
): Promise<string> {
  // MOCK: return placeholder
  console.log(`[MOCK] getValidCalendarToken for ${provider} — userId: ${userId}`)
  return 'mock_access_token_123'

  /*
  REAL IMPLEMENTATION:
  const { data: integration } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single()

  if (!integration) throw new Error('Calendar not connected')

  const expiry = new Date(integration.token_expires_at)
  if (expiry < new Date()) {
    const newTokens = await refreshOAuthToken(integration.refresh_token, provider)
    await supabase.from('user_integrations').update({
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
    }).eq('id', integration.id)
    return newTokens.access_token
  }

  return integration.access_token
  */
}

// ─── Embed Text ───────────────────────────────────────────────────────────────
// REAL: call Gemini text-embedding-004 API
// REAL: store result in aila_memories(embedding vector(768))

export async function embedText(text: string): Promise<number[]> {
  // MOCK: return dummy 768-dim vector
  console.log('[MOCK] embedText — would call Gemini embedding API')
  return new Array(768).fill(0).map(() => Math.random())

  /*
  REAL IMPLEMENTATION:
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] },
      }),
    }
  )
  const data = await response.json()
  return data.embedding.values
  */
}

// ─── Search Memories ──────────────────────────────────────────────────────────
// REAL: embed query → call Supabase match_memories RPC

export async function searchMemories(
  query: string,
  userId: string,
  limit = 5
) {
  // MOCK: return static memories from mock data
  console.log('[MOCK] searchMemories — would call Supabase pgvector RPC')

  const { MOCK_MEMORIES } = await import('./mockData')
  return MOCK_MEMORIES.slice(0, limit)

  /*
  REAL IMPLEMENTATION:
  const embedding = await embedText(query)
  const { data, error } = await supabase.rpc('match_memories', {
    query_embedding: embedding,
    match_user_id: userId,
    match_count: limit,
  })
  if (error) throw error
  return data
  */
}

// ─── Store Memory ─────────────────────────────────────────────────────────────
// REAL: embed content → insert into aila_memories

export async function storeMemory(
  userId: string,
  agent: string,
  content: string,
  memoryType: string
) {
  // MOCK: just log
  console.log(`[MOCK] storeMemory: [${agent}] ${content}`)

  /*
  REAL IMPLEMENTATION:
  const embedding = await embedText(content)
  await supabase.from('aila_memories').insert({
    user_id: userId,
    agent,
    content,
    embedding,
    memory_type: memoryType,
  })
  */
}

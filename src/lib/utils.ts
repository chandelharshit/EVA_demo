// ─────────────────────────────────────────────
//  AILA — PII Scrubber
//  Called on EVERY user message before any LLM call
// ─────────────────────────────────────────────

import type { UserHealthProfile } from '../types'

export function scrubPII(text: string, profile?: UserHealthProfile): string {
  let clean = text

  // Phone numbers
  clean = clean.replace(/\b\d{10}\b/g, '[PHONE]')
  clean = clean.replace(/\+91[\s-]?\d{10}/g, '[PHONE]')

  // Email addresses
  clean = clean.replace(/\b[\w.%+-]+@[\w.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]')

  // Aadhaar (12 digits)
  clean = clean.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[AADHAAR]')

  // Family member names from profile
  if (profile?.familyMembers) {
    profile.familyMembers.forEach(m => {
      const regex = new RegExp(`\\b${m.name}\\b`, 'gi')
      clean = clean.replace(regex, '[FAMILY_MEMBER]')
    })
  }

  return clean
}

// ─────────────────────────────────────────────
//  Memory helpers
//  TODO: replace with actual Supabase pgvector calls
// ─────────────────────────────────────────────

import type { Memory, Agent } from '../types'
import { MOCK_MEMORIES } from './mockData'

// TODO: call Gemini text-embedding-004 to embed the query
// then call match_memories(embedding, userId, 5) in Supabase
export async function searchMemories(
  _query: string,
  _userId: string,
  limit = 5
): Promise<Memory[]> {
  // MOCK: return top memories sorted by fake similarity
  return MOCK_MEMORIES.slice(0, limit)
}

// TODO: embed content + upsert to aila_memories table in Supabase
export async function storeMemory(
  userId: string,
  agent: Agent,
  content: string,
  memoryType: Memory['memoryType']
): Promise<void> {
  // MOCK: just log — replace with Supabase insert + Gemini embed
  console.log(`[Memory stored] ${agent} → ${memoryType}: ${content.slice(0, 60)}...`)
}

// ─────────────────────────────────────────────
//  Token refresh for Calendar OAuth
//  TODO: implement with actual provider SDKs
// ─────────────────────────────────────────────

export async function getValidCalendarToken(
  _userId: string,
  _provider: 'google' | 'outlook'
): Promise<string> {
  // TODO:
  // 1. fetch user_integrations row from Supabase
  // 2. if token_expires_at < now → call refresh endpoint
  // 3. update Supabase with new tokens
  // 4. return valid access_token
  return 'MOCK_ACCESS_TOKEN'
}

// ─────────────────────────────────────────────
//  Content extractor (Gemini returns blocks)
// ─────────────────────────────────────────────

export function extractContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((b: unknown) => (typeof b === 'string' ? b : (b as { text?: string })?.text ?? ''))
      .join('')
  }
  return ''
}

// ─────────────────────────────────────────────
//  Day helpers
// ─────────────────────────────────────────────

export function getTodayDayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' })
}

export function isQuietHours(quietStart: string, quietEnd: string): boolean {
  const now   = new Date()
  const hrs   = now.getHours() * 60 + now.getMinutes()
  const [sh, sm] = quietStart.split(':').map(Number)
  const [eh, em] = quietEnd.split(':').map(Number)
  const start = sh * 60 + sm
  const end   = eh * 60 + em

  // Handle overnight (e.g. 21:00 – 07:00)
  if (start > end) return hrs >= start || hrs < end
  return hrs >= start && hrs < end
}

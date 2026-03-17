import type { CalendarEvent } from '../../types'
import { getValidCalendarToken } from '../utils'
import { MOCK_CALENDAR_EVENTS } from '../mockData'

// ─── Calendar Service Interface ───────────────────────────────────────────────
// TaskAgent always calls this — never Google/Outlook SDKs directly
// Adding a new calendar provider = new class, zero changes to TaskAgent

interface CalendarService {
  getTodayEvents(userId: string): Promise<CalendarEvent[]>
  getWeekEvents(userId: string): Promise<CalendarEvent[]>
  getEvent(userId: string, eventId: string): Promise<CalendarEvent | null>
}

// ─── Mock Calendar Service ────────────────────────────────────────────────────

class MockCalendarService implements CalendarService {
  async getTodayEvents(_userId: string): Promise<CalendarEvent[]> {
    console.log('[MOCK] CalendarService.getTodayEvents')
    return MOCK_CALENDAR_EVENTS
  }

  async getWeekEvents(_userId: string): Promise<CalendarEvent[]> {
    console.log('[MOCK] CalendarService.getWeekEvents')
    return MOCK_CALENDAR_EVENTS
  }

  async getEvent(_userId: string, eventId: string): Promise<CalendarEvent | null> {
    console.log('[MOCK] CalendarService.getEvent:', eventId)
    return MOCK_CALENDAR_EVENTS.find(e => e.id === eventId) ?? null
  }
}

// ─── Google Calendar Service ──────────────────────────────────────────────────
// REAL: uses Google Calendar API v3
// REAL: requires OAuth token from user_integrations table

class GoogleCalendarService implements CalendarService {
  async getTodayEvents(userId: string): Promise<CalendarEvent[]> {
    // REAL IMPLEMENTATION:
    /*
    const token = await getValidCalendarToken(userId, 'google')
    const today = new Date()
    const timeMin = new Date(today.setHours(0,0,0,0)).toISOString()
    const timeMax = new Date(today.setHours(23,59,59,999)).toISOString()

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await res.json()
    return data.items.map(normalizeGoogleEvent)
    */
    console.log('[MOCK] GoogleCalendarService.getTodayEvents — would call Google Calendar API v3')
    return MOCK_CALENDAR_EVENTS.map(e => ({ ...e, provider: 'google' as const }))
  }

  async getWeekEvents(userId: string): Promise<CalendarEvent[]> {
    // REAL: same as above with 7-day window
    console.log('[MOCK] GoogleCalendarService.getWeekEvents')
    return MOCK_CALENDAR_EVENTS.map(e => ({ ...e, provider: 'google' as const }))
  }

  async getEvent(userId: string, eventId: string): Promise<CalendarEvent | null> {
    // REAL:
    /*
    const token = await getValidCalendarToken(userId, 'google')
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await res.json()
    return normalizeGoogleEvent(data)
    */
    console.log('[MOCK] GoogleCalendarService.getEvent:', eventId)
    return MOCK_CALENDAR_EVENTS.find(e => e.id === eventId) ?? null
  }
}

// ─── Outlook Calendar Service ─────────────────────────────────────────────────
// REAL: uses Microsoft Graph API
// REAL: endpoint: https://graph.microsoft.com/v1.0/me/events

class OutlookCalendarService implements CalendarService {
  async getTodayEvents(userId: string): Promise<CalendarEvent[]> {
    // REAL IMPLEMENTATION:
    /*
    const token = await getValidCalendarToken(userId, 'outlook')
    const today = new Date().toISOString().split('T')[0]

    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${today}T00:00:00&endDateTime=${today}T23:59:59`,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    )
    const data = await res.json()
    return data.value.map(normalizeOutlookEvent)
    */
    console.log('[MOCK] OutlookCalendarService.getTodayEvents — would call Microsoft Graph API')
    return MOCK_CALENDAR_EVENTS.map(e => ({ ...e, provider: 'outlook' as const }))
  }

  async getWeekEvents(userId: string): Promise<CalendarEvent[]> {
    console.log('[MOCK] OutlookCalendarService.getWeekEvents')
    return MOCK_CALENDAR_EVENTS.map(e => ({ ...e, provider: 'outlook' as const }))
  }

  async getEvent(userId: string, eventId: string): Promise<CalendarEvent | null> {
    console.log('[MOCK] OutlookCalendarService.getEvent:', eventId)
    return MOCK_CALENDAR_EVENTS.find(e => e.id === eventId) ?? null
  }
}

// ─── Normalizers ──────────────────────────────────────────────────────────────
// REAL: converts provider-specific shapes to our CalendarEvent interface

/*
function normalizeGoogleEvent(item: any): CalendarEvent {
  return {
    id:          item.id,
    title:       item.summary,
    start:       item.start.dateTime || item.start.date,
    end:         item.end.dateTime   || item.end.date,
    attendees:   (item.attendees ?? []).map((a: any) => ({ name: a.displayName ?? a.email, email: a.email })),
    description: item.description,
    meetLink:    item.hangoutLink,
    provider:    'google',
    isRecurring: !!item.recurringEventId,
  }
}

function normalizeOutlookEvent(item: any): CalendarEvent {
  return {
    id:          item.id,
    title:       item.subject,
    start:       item.start.dateTime,
    end:         item.end.dateTime,
    attendees:   (item.attendees ?? []).map((a: any) => ({ name: a.emailAddress.name, email: a.emailAddress.address })),
    description: item.body?.content,
    meetLink:    item.onlineMeeting?.joinUrl,
    provider:    'outlook',
    isRecurring: !!item.seriesMasterId,
  }
}
*/

// ─── Factory ──────────────────────────────────────────────────────────────────
// Returns the right service based on what the user has connected
// REAL: check user_integrations table to determine connected provider

export function getCalendarService(provider: 'google' | 'outlook' | 'mock' = 'mock'): CalendarService {
  // REAL: look up from user_integrations in Supabase
  // const { data } = await supabase.from('user_integrations').select('provider').eq('user_id', userId)
  // const provider = data?.[0]?.provider ?? 'mock'

  switch (provider) {
    case 'google':  return new GoogleCalendarService()
    case 'outlook': return new OutlookCalendarService()
    default:        return new MockCalendarService()
  }
}

// ─────────────────────────────────────────────
//  AILA — Calendar Service
//  CalendarService interface + mock impl
//  Replace GoogleCalendarService / OutlookCalendarService
//  with real API calls after OAuth is connected
// ─────────────────────────────────────────────

import type { CalendarEvent, CalendarProvider } from '../../types'
import { MOCK_CALENDAR_EVENTS } from '../mockData'
import { getValidCalendarToken } from '../utils'

// ── Interface (TaskAgent only ever calls this) ─
export interface ICalendarService {
  getTodayEvents(userId: string): Promise<CalendarEvent[]>
  getWeekEvents(userId: string): Promise<CalendarEvent[]>
  getEvent(userId: string, eventId: string): Promise<CalendarEvent | null>
}

// ── Mock implementation (used until OAuth connected) ──
class MockCalendarService implements ICalendarService {
  async getTodayEvents(_userId: string): Promise<CalendarEvent[]> {
    // TODO: replace with real DB/API call
    return MOCK_CALENDAR_EVENTS
  }
  async getWeekEvents(_userId: string): Promise<CalendarEvent[]> {
    return MOCK_CALENDAR_EVENTS
  }
  async getEvent(_userId: string, eventId: string): Promise<CalendarEvent | null> {
    return MOCK_CALENDAR_EVENTS.find(e => e.id === eventId) ?? null
  }
}

// ── Google Calendar Service ────────────────────
class GoogleCalendarService implements ICalendarService {
  async getTodayEvents(userId: string): Promise<CalendarEvent[]> {
    // TODO: implement with Google Calendar API
    // const token = await getValidCalendarToken(userId, 'google')
    // const today = new Date().toISOString().split('T')[0]
    // const res = await fetch(
    //   `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
    //   `?timeMin=${today}T00:00:00Z&timeMax=${today}T23:59:59Z&singleEvents=true`,
    //   { headers: { Authorization: `Bearer ${token}` } }
    // )
    // const data = await res.json()
    // return data.items.map(normalizeGoogleEvent)
    return MOCK_CALENDAR_EVENTS
  }

  async getWeekEvents(userId: string): Promise<CalendarEvent[]> {
    // TODO: similar to getTodayEvents but wider time range
    return MOCK_CALENDAR_EVENTS
  }

  async getEvent(userId: string, eventId: string): Promise<CalendarEvent | null> {
    // TODO:
    // const token = await getValidCalendarToken(userId, 'google')
    // const res = await fetch(
    //   `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    //   { headers: { Authorization: `Bearer ${token}` } }
    // )
    // const data = await res.json()
    // return normalizeGoogleEvent(data)
    return MOCK_CALENDAR_EVENTS.find(e => e.id === eventId) ?? null
  }
}

// ── Outlook Calendar Service ───────────────────
class OutlookCalendarService implements ICalendarService {
  async getTodayEvents(userId: string): Promise<CalendarEvent[]> {
    // TODO: implement with Microsoft Graph API
    // const token = await getValidCalendarToken(userId, 'outlook')
    // const today = new Date().toISOString().split('T')[0]
    // const res = await fetch(
    //   `https://graph.microsoft.com/v1.0/me/calendarView` +
    //   `?startDateTime=${today}T00:00:00Z&endDateTime=${today}T23:59:59Z`,
    //   { headers: { Authorization: `Bearer ${token}` } }
    // )
    // const data = await res.json()
    // return data.value.map(normalizeOutlookEvent)
    return MOCK_CALENDAR_EVENTS.map(e => ({ ...e, provider: 'outlook' as CalendarProvider }))
  }

  async getWeekEvents(userId: string): Promise<CalendarEvent[]> {
    return MOCK_CALENDAR_EVENTS
  }

  async getEvent(userId: string, eventId: string): Promise<CalendarEvent | null> {
    return MOCK_CALENDAR_EVENTS.find(e => e.id === eventId) ?? null
  }
}

// ── Factory — picks right service per user ─────
export function getCalendarService(
  provider?: CalendarProvider,
  isConnected = false
): ICalendarService {
  if (!isConnected || !provider) return new MockCalendarService()
  if (provider === 'google')  return new GoogleCalendarService()
  if (provider === 'outlook') return new OutlookCalendarService()
  return new MockCalendarService()
}

// ── Normalizers (TODO: implement when real APIs connected) ──

// function normalizeGoogleEvent(item: any): CalendarEvent {
//   return {
//     id:          item.id,
//     title:       item.summary,
//     start:       new Date(item.start.dateTime || item.start.date),
//     end:         new Date(item.end.dateTime   || item.end.date),
//     attendees:   (item.attendees || []).map((a: any) => ({ name: a.displayName || a.email, email: a.email })),
//     description: item.description,
//     meetLink:    item.hangoutLink,
//     provider:    'google',
//     isRecurring: !!item.recurringEventId,
//   }
// }

// function normalizeOutlookEvent(item: any): CalendarEvent {
//   return {
//     id:          item.id,
//     title:       item.subject,
//     start:       new Date(item.start.dateTime),
//     end:         new Date(item.end.dateTime),
//     attendees:   (item.attendees || []).map((a: any) => ({ name: a.emailAddress.name, email: a.emailAddress.address })),
//     description: item.body?.content,
//     meetLink:    item.onlineMeeting?.joinUrl,
//     provider:    'outlook',
//     isRecurring: !!item.seriesMasterId,
//   }
// }

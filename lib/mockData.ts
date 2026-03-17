import type {
  User, UserHealthProfile, UserWorkProfile, UserNotificationProfile,
  PantryItem, MealHistory, MealPreference, Memory, CalendarEvent,
  DashboardData, TaskAlert, MeetingMOM
} from '../types'

// ─── Mock User ────────────────────────────────────────────────────────────────
// REAL: fetch from Supabase → supabase.from('users').select().eq('id', userId)

export const MOCK_USER: User = {
  id: 'priya_001',
  name: 'Harshit',
  email: 'harshit@example.com',
  onboarding_complete: true,
  onboarding_step: 'DONE',
  created_at: '2026-03-01T00:00:00Z',
}

// ─── Mock Health Profile ──────────────────────────────────────────────────────
// REAL: supabase.from('user_health_profile').select().eq('user_id', userId)

export const MOCK_HEALTH_PROFILE: UserHealthProfile = {
  user_id: 'priya_001',
  family_members: [
    { name: 'Raj',   role: 'husband' },
    { name: 'Aarav', role: 'son',      age: 7,  allergies: ['peanuts', 'dairy'] },
    { name: 'Meera', role: 'daughter', age: 4 },
  ],
  cooking_time_weekday: 30,
  cooking_time_weekend: 60,
  cuisine_preferences: ['Indian', 'Italian'],
  cuisine_avoided: [],
  household_size: 4,
  health_conditions: ['low iron', 'thyroid'],
  diet_type: 'non-veg',
  raw_onboarding_summary: 'Family of 4, Aarav allergic to peanuts and dairy. Prefers quick weekday meals. Likes Indian and Italian.',
}

// ─── Mock Work Profile ────────────────────────────────────────────────────────
// REAL: supabase.from('user_work_profile').select().eq('user_id', userId)

export const MOCK_WORK_PROFILE: UserWorkProfile = {
  user_id: 'priya_001',
  work_hours_start: '09:00',
  work_hours_end:   '18:00',
  recurring_meetings: [
    { title: 'Sprint Standup',  days: ['Mon', 'Wed', 'Fri'], time: '10:00' },
    { title: 'Product Review',  days: ['Thu'],               time: '15:00' },
    { title: '1:1 with Manager',days: ['Tue'],               time: '11:00' },
  ],
  productivity_drains: ['back-to-back meetings'],
  task_preference: 'priority',
}

// ─── Mock Notification Profile ────────────────────────────────────────────────
// REAL: supabase.from('user_notification_profile').select().eq('user_id', userId)

export const MOCK_NOTIFICATION_PROFILE: UserNotificationProfile = {
  user_id: 'priya_001',
  quiet_hours_start: '21:00',
  quiet_hours_end:   '07:00',
  alert_style: 'gentle',
  recurring_events: [
    { event: 'School pickup', time: '15:30', days: ['Mon','Tue','Wed','Thu','Fri'] },
    { event: 'Thyroid medication', time: '08:00', days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
  ],
}

// ─── Mock Pantry ──────────────────────────────────────────────────────────────
// REAL: supabase.from('pantry_items').select().eq('user_id', userId)

export const MOCK_PANTRY: PantryItem[] = [
  { id: 'p1',  user_id: 'priya_001', item_name: 'rice',      quantity: 500,  unit: 'g',       low_threshold: 200,  last_updated: '2026-03-17T10:00:00Z' },
  { id: 'p2',  user_id: 'priya_001', item_name: 'onion',     quantity: 4,    unit: 'pieces',  low_threshold: 2,    last_updated: '2026-03-17T10:00:00Z' },
  { id: 'p3',  user_id: 'priya_001', item_name: 'tomato',    quantity: 3,    unit: 'pieces',  low_threshold: 2,    last_updated: '2026-03-17T10:00:00Z' },
  { id: 'p4',  user_id: 'priya_001', item_name: 'eggs',      quantity: 6,    unit: 'pieces',  low_threshold: 4,    last_updated: '2026-03-17T10:00:00Z' },
  { id: 'p5',  user_id: 'priya_001', item_name: 'spinach',   quantity: 200,  unit: 'g',       low_threshold: 100,  last_updated: '2026-03-17T10:00:00Z' },
  { id: 'p6',  user_id: 'priya_001', item_name: 'paneer',    quantity: 250,  unit: 'g',       low_threshold: 100,  last_updated: '2026-03-17T10:00:00Z' },
  { id: 'p7',  user_id: 'priya_001', item_name: 'dal',       quantity: 150,  unit: 'g',       low_threshold: 200,  last_updated: '2026-03-17T10:00:00Z' },  // LOW
  { id: 'p8',  user_id: 'priya_001', item_name: 'pasta',     quantity: 400,  unit: 'g',       low_threshold: 100,  last_updated: '2026-03-17T10:00:00Z' },
  { id: 'p9',  user_id: 'priya_001', item_name: 'olive oil', quantity: 300,  unit: 'ml',      low_threshold: 100,  last_updated: '2026-03-17T10:00:00Z' },
  { id: 'p10', user_id: 'priya_001', item_name: 'garlic',    quantity: 1,    unit: 'pieces',  low_threshold: 2,    last_updated: '2026-03-17T10:00:00Z' },  // LOW
]

// ─── Mock Meal Preferences ────────────────────────────────────────────────────
// REAL: supabase.from('meal_preferences').select().eq('user_id', userId)

export const MOCK_MEAL_PREFERENCES: MealPreference[] = [
  { id: 'm1', user_id: 'priya_001', meal_name: 'Palak Paneer',    rating: 5, tags: ['healthy','quick','kids-friendly'] },
  { id: 'm2', user_id: 'priya_001', meal_name: 'Dal Tadka',       rating: 4, tags: ['comfort','protein'] },
  { id: 'm3', user_id: 'priya_001', meal_name: 'Pasta Arrabbiata',rating: 4, tags: ['quick','Italian'] },
  { id: 'm4', user_id: 'priya_001', meal_name: 'Khichdi',         rating: 5, tags: ['easy','comfort','healthy'] },
  { id: 'm5', user_id: 'priya_001', meal_name: 'Egg Bhurji',      rating: 4, tags: ['quick','protein','breakfast'] },
]

// ─── Mock Calendar Events ─────────────────────────────────────────────────────
// REAL: CalendarService.getTodayEvents(userId) → Google/Outlook API
// REAL: store OAuth tokens in supabase user_integrations table

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'evt1',
    title: 'Sprint Standup',
    start: '2026-03-18T10:00:00',
    end:   '2026-03-18T10:30:00',
    attendees: [
      { name: 'Raj Mehta',    email: 'raj@company.com'   },
      { name: 'Neha Sharma',  email: 'neha@company.com'  },
      { name: 'Harshit',      email: 'harshit@company.com'},
    ],
    description: 'Daily standup — blockers, progress, plans',
    meetLink: 'https://meet.google.com/abc-defg-hij',
    provider: 'mock',
    isRecurring: true,
  },
  {
    id: 'evt2',
    title: 'Product Review',
    start: '2026-03-18T15:00:00',
    end:   '2026-03-18T16:00:00',
    attendees: [
      { name: 'PM Lead',  email: 'pm@company.com' },
      { name: 'Harshit',  email: 'harshit@company.com' },
    ],
    description: 'Q1 product review — demo new features',
    provider: 'mock',
    isRecurring: false,
  },
  {
    id: 'evt3',
    title: 'School pickup — Aarav',
    start: '2026-03-18T15:30:00',
    end:   '2026-03-18T15:45:00',
    attendees: [],
    provider: 'mock',
    isRecurring: true,
  },
]

// ─── Mock Memories ────────────────────────────────────────────────────────────
// REAL: supabase.rpc('match_memories', { query_embedding, match_user_id, match_count: 5 })
// REAL: embed user message with Gemini → vector search Supabase pgvector

export const MOCK_MEMORIES: Memory[] = [
  { id: 'mem1', user_id: 'priya_001', agent: 'MealAgent',  content: 'User prefers meals under 30 minutes on weekdays',           memory_type: 'preference_learned', created_at: '2026-03-10T00:00:00Z' },
  { id: 'mem2', user_id: 'priya_001', agent: 'MealAgent',  content: 'Aarav is allergic to peanuts and dairy — always check',     memory_type: 'preference_learned', created_at: '2026-03-10T00:00:00Z' },
  { id: 'mem3', user_id: 'priya_001', agent: 'TaskAgent',  content: 'Thursday is usually a high-stress day — back to back meetings', memory_type: 'pattern_detected', created_at: '2026-03-12T00:00:00Z' },
  { id: 'mem4', user_id: 'priya_001', agent: 'MealAgent',  content: 'User loved Palak Paneer — cooked it 3 times this month',    memory_type: 'feedback_signal',   created_at: '2026-03-15T00:00:00Z' },
  { id: 'mem5', user_id: 'priya_001', agent: 'MisAgent',   content: 'Aarav has a school event on Friday March 22',               memory_type: 'event_context',     created_at: '2026-03-16T00:00:00Z' },
]

// ─── Mock Dashboard Data ──────────────────────────────────────────────────────
// REAL: aggregate from multiple tables + external weather API
// REAL: energy/stress scores computed by TaskAgent from work_profile patterns

export const MOCK_DASHBOARD: DashboardData = {
  energy_score:    7.2,
  stress_level:    'MEDIUM',
  stress_percent:  45,
  steps_today:     5400,
  steps_goal:      8000,
  time_saved_hours: 4.2,
  tonight_dinner: {
    name:       'Palak Paneer',
    time_mins:  25,
    calories:   380,
    difficulty: 'Easy',
  },
  weather: {
    city:      'New Delhi',
    temp:      28,
    condition: 'Clear Sky',
    humidity:  62,
    feels_like: 26,
    wind:      12,
  },
  task_alerts: [
    { id: 't1', title: 'Submit Q3 report',          status: 'OVERDUE',   detail: 'Was due yesterday',  action: 'Complete' },
    { id: 't2', title: 'Call client — Emma',         status: 'TODAY',     detail: 'Today 4:00 PM',      action: 'Defer'    },
    { id: 't3', title: 'Prepare presentation deck',  status: 'UPCOMING',  detail: 'In 44 hours',        action: 'Schedule' },
  ],
  tomorrow_prediction: 'Predicted energy: 4.2/10 · HIGH stress day ahead. EVA has queued easy meals and moved 2 deep-work tasks to Thursday\'s free window.',
}

// ─── Mock MOM ─────────────────────────────────────────────────────────────────
// REAL: supabase.from('meeting_moms').select().eq('user_id', userId).order('created_at', { ascending: false })

export const MOCK_MOMS: MeetingMOM[] = [
  {
    id: 'mom1',
    user_id: 'priya_001',
    event_id: 'evt1',
    title: 'Sprint Standup',
    meeting_date: '2026-03-17T10:00:00Z',
    attendees: [
      { name: 'Raj Mehta',  email: 'raj@company.com'  },
      { name: 'Neha Sharma',email: 'neha@company.com' },
    ],
    discussion: 'Payment gateway delay discussed. Neha demoed new dashboard.',
    action_items: [
      { owner: 'Raj Mehta', task: 'Fix payment gateway', due_date: '2026-03-21' },
      { owner: 'Neha',      task: 'Share dashboard recording', due_date: '2026-03-18' },
    ],
    next_steps: 'Next standup Wed March 20 at 10am',
    created_at: '2026-03-17T10:35:00Z',
  },
]

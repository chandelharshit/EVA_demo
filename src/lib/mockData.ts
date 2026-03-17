// ─────────────────────────────────────────────
//  AILA — Mock Data
//  Replace each section with real DB/API calls
// ─────────────────────────────────────────────

import type {
  User, UserHealthProfile, UserWorkProfile, UserNotificationProfile,
  PantryItem, MealHistory, Memory, DashboardData, CalendarEvent, MOM,
  Reminder, ChatMessage
} from '../types'

// ── Mock User ─────────────────────────────────
export const MOCK_USER: User = {
  id: 'priya_001',
  name: 'Harshit',
  email: 'harshit@example.com',
  onboardingComplete: true,
  onboardingStep: 'DONE',
  createdAt: new Date('2024-01-15'),
}

// ── Health Profile (MealAgent owns) ──────────
// TODO: fetch from Supabase → user_health_profile table
export const MOCK_HEALTH_PROFILE: UserHealthProfile = {
  userId: 'priya_001',
  familyMembers: [
    { name: 'Raj',   role: 'husband' },
    { name: 'Aarav', role: 'son',      age: 7,  allergies: ['peanuts', 'dairy'] },
    { name: 'Meera', role: 'daughter', age: 4 },
  ],
  cookingTimeWeekday: 30,
  cookingTimeWeekend: 60,
  cuisinePreferences: ['Indian', 'Italian'],
  cuisineAvoided: [],
  householdSize: 4,
  healthConditions: ['low iron', 'thyroid'],
  likedMeals: ['dal tadka', 'pasta', 'khichdi', 'palak paneer'],
  dietType: 'vegetarian',
}

// ── Work Profile (TaskAgent owns) ─────────────
// TODO: fetch from Supabase → user_work_profile table
export const MOCK_WORK_PROFILE: UserWorkProfile = {
  userId: 'priya_001',
  workHoursStart: '09:00',
  workHoursEnd:   '18:00',
  recurringMeetings: [
    { title: 'Sprint Standup',  days: ['Mon', 'Wed', 'Fri'], time: '10:00', attendees: ['Raj', 'Neha', 'Priya'] },
    { title: 'Product Review',  days: ['Thu'],               time: '15:00', attendees: ['Team'] },
  ],
  productivityDrains: ['back-to-back meetings'],
  taskPreference: 'priority',
  calendarConnected: false,       // TODO: set true after OAuth
  calendarProvider: undefined,
}

// ── Notification Profile (MisAgent owns) ──────
// TODO: fetch from Supabase → user_notification_profile table
export const MOCK_NOTIF_PROFILE: UserNotificationProfile = {
  userId: 'priya_001',
  quietHoursStart: '21:00',
  quietHoursEnd:   '07:00',
  alertStyle: 'gentle',
  recurringEvents: [
    { event: 'School pickup', time: '15:30', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    { event: 'Medication',    time: '08:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  ],
}

// ── Pantry ─────────────────────────────────────
// TODO: fetch from Supabase → pantry_items table
export const MOCK_PANTRY: PantryItem[] = [
  { id: 'p1', userId: 'priya_001', itemName: 'rice',        quantity: 500, unit: 'g',      lowThreshold: 200, lastUpdated: new Date() },
  { id: 'p2', userId: 'priya_001', itemName: 'onion',       quantity: 3,   unit: 'pieces', lowThreshold: 2,   lastUpdated: new Date() },
  { id: 'p3', userId: 'priya_001', itemName: 'tomato',      quantity: 2,   unit: 'pieces', lowThreshold: 2,   lastUpdated: new Date() },
  { id: 'p4', userId: 'priya_001', itemName: 'eggs',        quantity: 6,   unit: 'pieces', lowThreshold: 3,   lastUpdated: new Date() },
  { id: 'p5', userId: 'priya_001', itemName: 'palak',       quantity: 200, unit: 'g',      lowThreshold: 100, lastUpdated: new Date() },
  { id: 'p6', userId: 'priya_001', itemName: 'paneer',      quantity: 250, unit: 'g',      lowThreshold: 100, lastUpdated: new Date() },
  { id: 'p7', userId: 'priya_001', itemName: 'dal',         quantity: 50,  unit: 'g',      lowThreshold: 100, lastUpdated: new Date() },  // LOW
  { id: 'p8', userId: 'priya_001', itemName: 'olive oil',   quantity: 300, unit: 'ml',     lowThreshold: 100, lastUpdated: new Date() },
  { id: 'p9', userId: 'priya_001', itemName: 'pasta',       quantity: 400, unit: 'g',      lowThreshold: 100, lastUpdated: new Date() },
]

// ── Meal History ───────────────────────────────
// TODO: fetch from Supabase → meal_history table
export const MOCK_MEAL_HISTORY: MealHistory[] = [
  {
    id: 'mh1', userId: 'priya_001', mealName: 'Palak Paneer',
    ingredientsUsed: [
      { item: 'palak', qty: 200, unit: 'g',      available: true },
      { item: 'paneer', qty: 200, unit: 'g',     available: true },
      { item: 'onion',  qty: 1,   unit: 'pieces', available: true },
    ],
    wasSuggestedByAI: true, userConfirmed: true, cookedAt: new Date(Date.now() - 86400000),
  },
]

// ── Calendar Events (mock — replace with Google/Outlook API) ──
// TODO: fetch from CalendarService.getTodayEvents(userId)
export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'ce1', title: 'Sprint Standup',
    start: new Date(new Date().setHours(10, 0)),
    end:   new Date(new Date().setHours(10, 30)),
    attendees: [{ name: 'Raj', email: 'raj@company.com' }, { name: 'Neha', email: 'neha@company.com' }],
    description: 'Daily standup — blockers, progress, plans',
    provider: 'google', isRecurring: true,
  },
  {
    id: 'ce2', title: 'Product Review',
    start: new Date(new Date().setHours(15, 0)),
    end:   new Date(new Date().setHours(16, 0)),
    attendees: [{ name: 'Team', email: 'team@company.com' }],
    description: 'Q1 product review with stakeholders',
    provider: 'google', isRecurring: true,
  },
  {
    id: 'ce3', title: '1:1 with Manager',
    start: new Date(new Date().setHours(17, 0)),
    end:   new Date(new Date().setHours(17, 30)),
    attendees: [{ name: 'Neha', email: 'neha@company.com' }],
    provider: 'google', isRecurring: false,
  },
]

// ── MOMs ───────────────────────────────────────
// TODO: fetch from Supabase → meeting_moms table
export const MOCK_MOMS: MOM[] = [
  {
    id: 'mom1', userId: 'priya_001', eventId: 'ce1',
    title: 'Sprint Standup — Mar 15',
    meetingDate: new Date(Date.now() - 259200000),
    attendees: ['Raj', 'Neha', 'Priya'],
    discussionPoints: ['Payment gateway delay', 'New dashboard demo by Neha'],
    actionItems: [
      { owner: 'Raj',  task: 'Fix payment gateway',     dueDate: 'Mar 18' },
      { owner: 'Neha', task: 'Share dashboard recording', dueDate: 'Mar 16' },
    ],
    nextSteps: 'Follow up on gateway fix by Friday',
    createdAt: new Date(Date.now() - 259200000),
  },
]

// ── Reminders ─────────────────────────────────
// TODO: fetch from Supabase → reminders table
export const MOCK_REMINDERS: Reminder[] = [
  { id: 'r1', userId: 'priya_001', title: 'School pickup — Aarav & Meera', scheduledAt: new Date(new Date().setHours(15, 30)), isRecurring: true, recurrenceDays: ['Mon','Tue','Wed','Thu','Fri'], isActive: true },
  { id: 'r2', userId: 'priya_001', title: 'Morning medication', scheduledAt: new Date(new Date().setHours(8, 0)),  isRecurring: true, recurrenceDays: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], isActive: true },
]

// ── Memories (pgvector — mock top-5 results) ──
// TODO: call match_memories(embedding, userId, 5) in Supabase
export const MOCK_MEMORIES: Memory[] = [
  { id: 'm1', userId: 'priya_001', agent: 'MealAgent', content: 'User prefers quick meals under 30 minutes on weekdays', memoryType: 'preference_learned', similarity: 0.94, createdAt: new Date() },
  { id: 'm2', userId: 'priya_001', agent: 'MealAgent', content: 'Aarav is allergic to peanuts and dairy — must avoid in all suggestions', memoryType: 'preference_learned', similarity: 0.92, createdAt: new Date() },
  { id: 'm3', userId: 'priya_001', agent: 'TaskAgent', content: 'Thursday is usually Harshit\'s most stressful day — 3 meetings back to back', memoryType: 'pattern_detected', similarity: 0.87, createdAt: new Date() },
  { id: 'm4', userId: 'priya_001', agent: 'MealAgent', content: 'User liked palak paneer last time it was suggested', memoryType: 'feedback_signal', similarity: 0.85, createdAt: new Date() },
  { id: 'm5', userId: 'priya_001', agent: 'MisAgent',  content: 'School pickup reminder at 3:30pm is critical — never skip', memoryType: 'event_context', similarity: 0.81, createdAt: new Date() },
]

// ── Dashboard Data ─────────────────────────────
// TODO: compute dynamically from all agent data + Supabase
export const MOCK_DASHBOARD: DashboardData = {
  energyScore: 7.2,
  stressLevel: 'MEDIUM',
  stressPercent: 45,
  stepsToday: 5400,
  stepsGoal: 8000,
  timeSavedHours: 4.2,
  tonightsDinner: {
    name: 'Palak Paneer',
    cookTime: 25,
    calories: 380,
    difficulty: 'Easy',
    allergenFree: true,
    ingredients: [
      { item: 'palak',  qty: 200, unit: 'g',      available: true },
      { item: 'paneer', qty: 200, unit: 'g',      available: true },
      { item: 'onion',  qty: 1,   unit: 'pieces', available: true },
    ],
  },
  taskAlerts: [
    { id: 'ta1', title: 'Submit Q3 report', status: 'OVERDUE',  dueLabel: 'Was due yesterday' },
    { id: 'ta2', title: 'Call client — Emma', status: 'TODAY', dueLabel: 'Today 4:00 PM' },
    { id: 'ta3', title: 'Prepare presentation deck', status: 'UPCOMING', dueLabel: 'In 44 hours', hoursUntilDue: 44 },
  ],
  tomorrowPrediction: {
    energyScore: 4.2,
    stressLevel: 'HIGH',
    summary: 'HIGH stress day ahead — EVA has queued easy meals and moved 2 deep-work tasks to Thursday\'s free window',
  },
  weather: {
    city: 'New Delhi',
    tempC: 28,
    condition: 'Clear Sky',
    humidity: 62,
    feelsLike: 26,
    windKmh: 12,
  },
}

// ── Onboarding questions per agent ─────────────
export const ONBOARDING_QUESTIONS = {
  MEAL: [
    "Hi! I'm EVA 👋 What's your name and how old are you?",
    "What's your main health goal right now — losing weight, gaining, or staying consistent?",
    "Are you vegetarian, non-veg, vegan, or eggetarian? Any food allergies or strong dislikes?",
    "Does anyone in your family have a health condition I should cook around? (diabetes, thyroid, BP, iron deficiency...)",
    "How much time can you usually spare for cooking on weekdays? And any cuisines you love or want to avoid?",
  ],
  TASK: [
    "Now let me understand your work life! What are your core working hours?",
    "Do you have recurring meetings I should know about? (standups, reviews, 1:1s...)",
    "What drains you most — back-to-back meetings, late calls, or context switching?",
    "Do you prefer your tasks grouped by priority or by time of day?",
  ],
  MIS: [
    "Almost done! What are your quiet hours — when should I never disturb you?",
    "How do you prefer reminders — a gentle nudge or a firm alert?",
    "Any recurring events I should always track? (school pickup, medication, gym, prayer time...)",
  ],
}

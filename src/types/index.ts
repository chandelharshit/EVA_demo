// ─────────────────────────────────────────────
//  AILA — Shared Types
// ─────────────────────────────────────────────

export type Agent = 'EVA' | 'MealAgent' | 'TaskAgent' | 'MisAgent'
export type OnboardingStep = 'GREETING' | 'MEAL' | 'TASK' | 'MIS' | 'SUMMARY' | 'DONE'
export type CalendarProvider = 'google' | 'outlook'
export type AlertStyle = 'gentle' | 'firm'
export type TaskPreference = 'priority' | 'time-of-day'

// ── User ─────────────────────────────────────
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  onboardingComplete: boolean
  onboardingStep: OnboardingStep
  createdAt: Date
}

// ── Family ───────────────────────────────────
export interface FamilyMember {
  name: string
  role: string
  age?: number
  allergies?: string[]
  conditions?: string[]
}

// ── Profiles (owned by each agent) ───────────
export interface UserHealthProfile {
  userId: string
  familyMembers: FamilyMember[]
  cookingTimeWeekday: number       // minutes
  cookingTimeWeekend: number
  cuisinePreferences: string[]
  cuisineAvoided: string[]
  householdSize: number
  healthConditions: string[]
  likedMeals: string[]
  dietType: 'vegetarian' | 'non-veg' | 'vegan' | 'eggetarian'
}

export interface UserWorkProfile {
  userId: string
  workHoursStart: string           // "09:00"
  workHoursEnd: string             // "18:00"
  recurringMeetings: RecurringMeeting[]
  productivityDrains: string[]
  taskPreference: TaskPreference
  calendarConnected: boolean
  calendarProvider?: CalendarProvider
}

export interface UserNotificationProfile {
  userId: string
  quietHoursStart: string          // "21:00"
  quietHoursEnd: string            // "07:00"
  alertStyle: AlertStyle
  recurringEvents: RecurringEvent[]
}

// ── Meetings & Calendar ───────────────────────
export interface RecurringMeeting {
  title: string
  days: string[]
  time: string
  attendees?: string[]
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  attendees: { name: string; email: string }[]
  description?: string
  meetLink?: string
  provider: CalendarProvider
  isRecurring: boolean
}

export interface MOM {
  id: string
  userId: string
  eventId?: string
  title: string
  meetingDate: Date
  attendees: string[]
  discussionPoints: string[]
  actionItems: { owner: string; task: string; dueDate?: string }[]
  nextSteps?: string
  createdAt: Date
}

// ── Pantry & Meals ────────────────────────────
export interface PantryItem {
  id: string
  userId: string
  itemName: string
  quantity: number
  unit: string
  lowThreshold: number
  lastUpdated: Date
}

export interface MealSuggestion {
  name: string
  cookTime: number               // minutes
  calories: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  ingredients: IngredientCheck[]
  allergenFree: boolean
}

export interface IngredientCheck {
  item: string
  qty: number
  unit: string
  available: boolean             // true = in pantry
}

export interface MealHistory {
  id: string
  userId: string
  mealName: string
  ingredientsUsed: IngredientCheck[]
  wasSuggestedByAI: boolean
  userConfirmed: boolean
  cookedAt: Date
}

// ── Reminders & Events ────────────────────────
export interface RecurringEvent {
  event: string
  time: string
  days: string[]
}

export interface Reminder {
  id: string
  userId: string
  title: string
  scheduledAt: Date
  isRecurring: boolean
  recurrenceDays?: string[]
  isActive: boolean
}

// ── Chat ──────────────────────────────────────
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  agent?: Agent
  timestamp: Date
  pendingAction?: PendingAction
  isVoice?: boolean
}

export interface PendingAction {
  type: 'CONFIRM_COOKING' | 'CONFIRM_REMINDER' | 'CONFIRM_TASK'
  meal?: string
  ingredientsToDeduct?: IngredientCheck[]
  reminder?: Partial<Reminder>
  task?: string
}

// ── Memory ────────────────────────────────────
export interface Memory {
  id: string
  userId: string
  agent: Agent
  content: string
  memoryType: 'preference_learned' | 'pattern_detected' | 'event_context' | 'feedback_signal'
  similarity?: number
  createdAt: Date
}

// ── API Contracts ─────────────────────────────
export interface ChatRequest {
  message: string
  userId: string
  conversationHistory: ChatMessage[]
  privacyMode: boolean
  isVoice?: boolean
}

export interface ChatResponse {
  response: string
  handledBy: Agent
  pendingAction?: PendingAction
  proactiveSuggestion?: string
}

export interface OnboardingRequest {
  userId: string
  step: OnboardingStep
  message: string
  conversationHistory: ChatMessage[]
}

export interface OnboardingResponse {
  response: string
  agent: Agent
  stepComplete: boolean
  nextStep: OnboardingStep
}

// ── Dashboard ─────────────────────────────────
export interface DashboardData {
  energyScore: number
  stressLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  stressPercent: number
  stepsToday: number
  stepsGoal: number
  timeSavedHours: number
  tonightsDinner?: MealSuggestion
  taskAlerts: TaskAlert[]
  tomorrowPrediction: TomorrowPrediction
  weather: WeatherData
}

export interface TaskAlert {
  id: string
  title: string
  status: 'OVERDUE' | 'TODAY' | 'UPCOMING'
  dueLabel: string
  hoursUntilDue?: number
}

export interface TomorrowPrediction {
  energyScore: number
  stressLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  summary: string
}

export interface WeatherData {
  city: string
  tempC: number
  condition: string
  humidity: number
  feelsLike: number
  windKmh: number
}

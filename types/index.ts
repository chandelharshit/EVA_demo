// ─── Core User Types ──────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  onboarding_complete: boolean
  onboarding_step: OnboardingStep
  created_at: string
}

export type OnboardingStep = 'GREETING' | 'MEAL' | 'TASK' | 'MIS' | 'SUMMARY' | 'DONE'

// ─── Profile Types (one per agent domain) ────────────────────────────────────

export interface FamilyMember {
  name: string
  role: string
  age?: number
  allergies?: string[]
  conditions?: string[]
}

export interface UserHealthProfile {
  user_id: string
  family_members: FamilyMember[]
  cooking_time_weekday: number        // minutes
  cooking_time_weekend: number
  cuisine_preferences: string[]
  cuisine_avoided: string[]
  household_size: number
  health_conditions: string[]
  diet_type: string                   // 'veg' | 'non-veg' | 'vegan' | 'eggetarian'
  raw_onboarding_summary?: string
}

export interface RecurringMeeting {
  title: string
  days: string[]
  time: string
}

export interface UserWorkProfile {
  user_id: string
  work_hours_start: string
  work_hours_end: string
  recurring_meetings: RecurringMeeting[]
  productivity_drains: string[]
  task_preference: 'priority' | 'time-of-day'
  raw_onboarding_summary?: string
}

export interface RecurringEvent {
  event: string
  time: string
  days: string[]
}

export interface UserNotificationProfile {
  user_id: string
  quiet_hours_start: string
  quiet_hours_end: string
  alert_style: 'gentle' | 'firm'
  recurring_events: RecurringEvent[]
  raw_onboarding_summary?: string
}

// ─── Pantry Types ─────────────────────────────────────────────────────────────

export interface PantryItem {
  id: string
  user_id: string
  item_name: string
  quantity: number
  unit: string                        // 'kg' | 'g' | 'pieces' | 'cups' | 'liters'
  low_threshold: number
  last_updated: string
}

export interface MealHistory {
  id: string
  user_id: string
  meal_name: string
  ingredients_used: IngredientUsed[]
  was_suggested_by_ai: boolean
  user_confirmed: boolean
  cooked_at: string
}

export interface IngredientUsed {
  item: string
  qty: number
  unit: string
}

export interface MealPreference {
  id: string
  user_id: string
  meal_name: string
  rating: number
  tags: string[]
}

// ─── Memory Types ─────────────────────────────────────────────────────────────

export interface Memory {
  id: string
  user_id: string
  agent: AgentName
  content: string
  memory_type: 'preference_learned' | 'pattern_detected' | 'event_context' | 'feedback_signal'
  similarity?: number
  created_at: string
}

// ─── Agent Types ──────────────────────────────────────────────────────────────

export type AgentName = 'EVA' | 'MealAgent' | 'TaskAgent' | 'MisAgent'

export interface PendingAction {
  type: 'CONFIRM_COOKING' | 'CONFIRM_REMINDER' | 'CONFIRM_TASK'
  meal?: string
  ingredientsToDeduct?: IngredientUsed[]
  reminder?: { event: string; time: string }
  task?: { title: string; due: string }
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  agent?: AgentName
  timestamp: string
  pendingAction?: PendingAction
}

export interface ChatResponse {
  response: string
  handledBy: AgentName
  pendingAction?: PendingAction
  proactiveSuggestion?: string
}

// ─── Calendar Types ───────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  attendees: { name: string; email: string }[]
  description?: string
  meetLink?: string
  provider: 'google' | 'outlook' | 'mock'
  isRecurring: boolean
}

export interface MeetingMOM {
  id: string
  user_id: string
  event_id: string
  title: string
  meeting_date: string
  attendees: { name: string; email: string }[]
  discussion: string
  action_items: { owner: string; task: string; due_date: string }[]
  next_steps: string
  created_at: string
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export interface DashboardData {
  energy_score: number
  stress_level: 'LOW' | 'MEDIUM' | 'HIGH'
  stress_percent: number
  steps_today: number
  steps_goal: number
  time_saved_hours: number
  tonight_dinner?: {
    name: string
    time_mins: number
    calories: number
    difficulty: string
  }
  weather?: {
    city: string
    temp: number
    condition: string
    humidity: number
    feels_like: number
    wind: number
  }
  task_alerts: TaskAlert[]
  tomorrow_prediction?: string
}

export interface TaskAlert {
  id: string
  title: string
  status: 'OVERDUE' | 'TODAY' | 'UPCOMING'
  detail: string
  action: 'Complete' | 'Defer' | 'Schedule'
}

// ─── Voice Types ──────────────────────────────────────────────────────────────

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking'

export interface VoiceConfig {
  enabled: boolean
  voice_id: string
  stability: number
  similarity_boost: number
}

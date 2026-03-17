-- ============================================================
-- EVA — Full Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable pgvector extension
create extension if not exists vector;

-- ── Users ───────────────────────────────────────────────────
create table if not exists users (
  id                  uuid primary key default gen_random_uuid(),
  name                text,
  email               text unique,
  avatar              text,
  onboarding_complete boolean   default false,
  onboarding_step     text      default 'MEAL',
  created_at          timestamp default now()
);

-- ── Health Profile (MealAgent) ───────────────────────────────
create table if not exists user_health_profile (
  user_id                uuid references users(id) on delete cascade,
  family_members         jsonb    default '[]',
  cooking_time_weekday   int      default 30,
  cooking_time_weekend   int      default 60,
  cuisine_preferences    text[]   default '{}',
  cuisine_avoided        text[]   default '{}',
  household_size         int      default 1,
  health_conditions      text[]   default '{}',
  diet_type              text     default 'non-veg',
  raw_onboarding_summary text,
  updated_at             timestamp default now(),
  primary key (user_id)
);

-- ── Work Profile (TaskAgent) ─────────────────────────────────
create table if not exists user_work_profile (
  user_id                uuid references users(id) on delete cascade,
  work_hours_start       time     default '09:00',
  work_hours_end         time     default '18:00',
  recurring_meetings     jsonb    default '[]',
  productivity_drains    text[]   default '{}',
  task_preference        text     default 'priority',
  raw_onboarding_summary text,
  updated_at             timestamp default now(),
  primary key (user_id)
);

-- ── Notification Profile (MisAgent) ─────────────────────────
create table if not exists user_notification_profile (
  user_id                uuid references users(id) on delete cascade,
  quiet_hours_start      time     default '21:00',
  quiet_hours_end        time     default '07:00',
  alert_style            text     default 'gentle',
  recurring_events       jsonb    default '[]',
  raw_onboarding_summary text,
  updated_at             timestamp default now(),
  primary key (user_id)
);

-- ── Pantry ───────────────────────────────────────────────────
create table if not exists pantry_items (
  id            uuid      primary key default gen_random_uuid(),
  user_id       uuid      references users(id) on delete cascade,
  item_name     text      not null,
  quantity      float     default 0,
  unit          text      default 'pieces',
  low_threshold float     default 2,
  last_updated  timestamp default now(),
  unique(user_id, item_name)
);

-- ── Meal History ─────────────────────────────────────────────
create table if not exists meal_history (
  id                  uuid      primary key default gen_random_uuid(),
  user_id             uuid      references users(id) on delete cascade,
  meal_name           text      not null,
  ingredients_used    jsonb     default '[]',
  was_suggested_by_ai boolean   default false,
  user_confirmed      boolean   default false,
  cooked_at           timestamp default now()
);

-- ── Meal Preferences ─────────────────────────────────────────
create table if not exists meal_preferences (
  id          uuid    primary key default gen_random_uuid(),
  user_id     uuid    references users(id) on delete cascade,
  meal_name   text    not null,
  rating      int     check (rating between 1 and 5),
  tags        text[]  default '{}',
  created_at  timestamp default now(),
  unique(user_id, meal_name)
);

-- ── Calendar Integrations ────────────────────────────────────
-- REAL: access_token and refresh_token should be encrypted at rest
-- REAL: use pgcrypto or Vault for encryption
create table if not exists user_integrations (
  id                uuid      primary key default gen_random_uuid(),
  user_id           uuid      references users(id) on delete cascade,
  provider          text      not null,        -- 'google' | 'outlook'
  access_token      text      not null,        -- ENCRYPT THIS
  refresh_token     text      not null,        -- ENCRYPT THIS
  token_expires_at  timestamp,
  calendar_id       text,
  connected_at      timestamp default now(),
  unique(user_id, provider)
);

-- ── Meeting MOMs ─────────────────────────────────────────────
create table if not exists meeting_moms (
  id            uuid      primary key default gen_random_uuid(),
  user_id       uuid      references users(id) on delete cascade,
  event_id      text,
  provider      text,
  title         text,
  meeting_date  timestamp,
  attendees     jsonb     default '[]',
  discussion    text,
  action_items  jsonb     default '[]',
  next_steps    text,
  created_at    timestamp default now()
);

-- ── Vector Memories (pgvector) ───────────────────────────────
create table if not exists aila_memories (
  id          uuid      primary key default gen_random_uuid(),
  user_id     text      not null,
  agent       text      not null,
  content     text      not null,
  embedding   vector(768),
  memory_type text,
  created_at  timestamp default now()
);

-- IVFFlat index for fast approximate nearest-neighbor search
-- lists = 100 is good for up to ~1M rows
create index if not exists aila_memories_embedding_idx
  on aila_memories
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ── Vector Search Function ───────────────────────────────────
create or replace function match_memories(
  query_embedding vector(768),
  match_user_id   text,
  match_count     int default 5
)
returns table(
  id          uuid,
  content     text,
  agent       text,
  memory_type text,
  similarity  float
)
language sql stable as $$
  select
    id, content, agent, memory_type,
    1 - (embedding <=> query_embedding) as similarity
  from aila_memories
  where user_id = match_user_id
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- ── Row Level Security ───────────────────────────────────────
-- REAL: enable RLS so users can only see their own data
-- alter table users                    enable row level security;
-- alter table user_health_profile      enable row level security;
-- alter table user_work_profile        enable row level security;
-- alter table user_notification_profile enable row level security;
-- alter table pantry_items             enable row level security;
-- alter table meal_history             enable row level security;
-- alter table aila_memories            enable row level security;

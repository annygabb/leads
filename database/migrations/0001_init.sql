-- ============================================================================
-- LEADHUNTER — INITIAL SCHEMA
-- ============================================================================
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
create type lead_status as enum (
  'nao_iniciado',
  'contato_iniciado',
  'em_negociacao',
  'em_andamento',
  'aguardando',
  'sem_resposta',
  'negou',
  'cliente',
  'pago',
  'finalizado'
);

create type lead_priority as enum ('baixa', 'media', 'alta', 'urgente');

-- ----------------------------------------------------------------------------
-- LOOKUP TABLES (CRUD-able)
-- ----------------------------------------------------------------------------
create table niches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  uf text not null,
  created_at timestamptz not null default now(),
  unique (user_id, uf)
);

create table cities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  state_id uuid references states(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now()
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#3B82F6',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- ----------------------------------------------------------------------------
-- SCORE RULES (editable by user)
-- ----------------------------------------------------------------------------
create table score_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,              -- e.g. 'sem_site', 'sem_instagram'
  label text not null,            -- human readable
  points integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, key)
);

-- ----------------------------------------------------------------------------
-- LEADS (core CRM entity)
-- ----------------------------------------------------------------------------
create table leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Identification
  google_place_id text,           -- for dedup on Places import
  company_name text not null,
  owner_name text,

  -- Contact
  phone text,
  whatsapp text,
  email text,
  instagram text,
  facebook text,
  linkedin text,
  website text,
  google_maps_url text,

  -- Location
  city text,
  state text,
  address text,
  postal_code text,
  latitude double precision,
  longitude double precision,

  -- Google Places metadata
  category text,
  google_rating numeric(2,1),
  google_reviews_count integer default 0,
  photos_count integer default 0,
  has_website boolean default false,
  has_instagram boolean default false,
  has_facebook boolean default false,

  -- CRM
  score integer not null default 0,
  priority lead_priority not null default 'baixa',
  status lead_status not null default 'nao_iniciado',
  last_contact_at timestamptz,
  next_contact_at timestamptz,
  notes text,
  is_favorite boolean not null default false,

  -- Meta
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prevent duplicate leads coming from the same Google Place per user
create unique index leads_user_place_unique
  on leads (user_id, google_place_id)
  where google_place_id is not null;

create index leads_user_id_idx on leads (user_id);
create index leads_status_idx on leads (status);
create index leads_priority_idx on leads (priority);
create index leads_city_idx on leads (city);
create index leads_state_idx on leads (state);
create index leads_category_idx on leads (category);
create index leads_score_idx on leads (score desc);
create index leads_created_at_idx on leads (created_at desc);
create index leads_favorite_idx on leads (is_favorite) where is_favorite = true;
create index leads_search_idx on leads
  using gin (to_tsvector('portuguese', coalesce(company_name,'') || ' ' || coalesce(owner_name,'')));

-- ----------------------------------------------------------------------------
-- LEAD <-> TAGS (many-to-many)
-- ----------------------------------------------------------------------------
create table lead_tags (
  lead_id uuid not null references leads(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (lead_id, tag_id)
);

-- ----------------------------------------------------------------------------
-- LEAD HISTORY (audit log of every field change)
-- ----------------------------------------------------------------------------
create table lead_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  field_changed text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

create index lead_history_lead_id_idx on lead_history (lead_id, created_at desc);

-- ----------------------------------------------------------------------------
-- SEARCH JOBS (tracks Google Places prospecting runs + pagination token)
-- ----------------------------------------------------------------------------
create table search_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  city text not null,
  state text not null,
  niche text not null,
  radius_km integer not null default 10,
  requested_count integer not null default 20,
  next_page_token text,
  total_found integer not null default 0,
  total_new integer not null default 0,
  status text not null default 'completed', -- running | completed | cancelled | error
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- UPDATED_AT TRIGGER
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_set_updated_at
  before update on leads
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table leads enable row level security;
alter table lead_tags enable row level security;
alter table lead_history enable row level security;
alter table niches enable row level security;
alter table states enable row level security;
alter table cities enable row level security;
alter table tags enable row level security;
alter table score_rules enable row level security;
alter table search_jobs enable row level security;

create policy "leads_owner_all" on leads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "lead_tags_owner_all" on lead_tags
  for all using (
    exists (select 1 from leads l where l.id = lead_id and l.user_id = auth.uid())
  );

create policy "lead_history_owner_all" on lead_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "niches_owner_all" on niches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "states_owner_all" on states
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "cities_owner_all" on cities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tags_owner_all" on tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "score_rules_owner_all" on score_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "search_jobs_owner_all" on search_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

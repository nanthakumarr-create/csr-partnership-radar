-- CSR Partnership Radar schema. Run once in the Supabase SQL editor.

create extension if not exists pgcrypto;

-- Single-row settings table
create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  sectors text[] not null default '{}',
  regions text[] not null default '{}',
  extra_keywords text[] not null default '{}',
  recipient_email text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.settings (id, sectors, regions, extra_keywords, recipient_email)
values (
  1,
  array['education', 'skill development', 'digital literacy', 'youth employment'],
  array['Maharashtra', 'Pune', 'Pan-India'],
  array[]::text[],
  ''
)
on conflict (id) do nothing;

create table if not exists public.digests (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  created_at timestamptz not null default now(),
  trigger text not null check (trigger in ('cron', 'manual')),
  status text not null check (status in ('success', 'partial', 'failed')),
  source_status jsonb not null default '{}'::jsonb,
  counts jsonb not null default '{}'::jsonb,
  email_sent boolean not null default false
);

create index if not exists digests_created_at_idx on public.digests (created_at desc);

create table if not exists public.digest_items (
  id uuid primary key default gen_random_uuid(),
  digest_id uuid not null references public.digests (id) on delete cascade,
  url text not null,
  url_hash text not null,
  title text not null,
  source text not null,
  published_at timestamptz,
  signal_type text check (signal_type in ('new_initiative', 'increased_allocation', 'partner_search', 'policy_change')),
  company text,
  sector text,
  region text,
  summary text,
  why_it_matters text,
  verdict text not null check (verdict in ('call', 'watch', 'skip')),
  reason text,
  priority integer check (priority between 1 and 5),
  unique (digest_id, url_hash)
);

-- Lets the pipeline skip URLs already sent in earlier digests
create index if not exists digest_items_url_hash_idx on public.digest_items (url_hash);
create index if not exists digest_items_digest_id_idx on public.digest_items (digest_id);

-- Only the server (service role) touches these tables; block anon/public access.
alter table public.settings enable row level security;
alter table public.digests enable row level security;
alter table public.digest_items enable row level security;

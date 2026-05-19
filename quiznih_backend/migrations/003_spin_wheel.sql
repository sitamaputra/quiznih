-- Migration 003: Spin Wheel tables
-- Jalankan di Supabase SQL Editor

-- ─── Spin Sessions ──────────────────────────────────────────────────────────

create table if not exists spin_sessions (
  id            uuid primary key default gen_random_uuid(),
  host_address  text not null,
  prize_pool    numeric not null,           -- dalam CELO (desimal)
  prize_per_spin numeric not null,          -- prize per 1x spin dalam CELO
  is_active     boolean not null default true,
  contract_session_id text,                 -- bytes32 dari contract (hex string)
  tx_hash       text,                       -- TX createSession()
  created_at    timestamptz not null default now(),
  expires_at    timestamptz,
  closed_at     timestamptz
);

-- ─── Spin Claims ─────────────────────────────────────────────────────────────

create table if not exists spin_claims (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references spin_sessions(id),
  player_address  text not null,
  amount_wei      text not null,            -- bigint as string
  signature       text not null,
  claimed_onchain boolean not null default false,
  tx_hash         text,                     -- TX claimSpin() setelah on-chain
  created_at      timestamptz not null default now(),

  -- Satu wallet hanya bisa claim 1x per session
  unique(session_id, player_address)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

create index if not exists idx_spin_claims_session on spin_claims(session_id);
create index if not exists idx_spin_claims_player  on spin_claims(player_address);
create index if not exists idx_spin_sessions_host  on spin_sessions(host_address);
create index if not exists idx_spin_sessions_active on spin_sessions(is_active) where is_active = true;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table spin_sessions enable row level security;
alter table spin_claims   enable row level security;

-- Sessions: siapapun bisa baca yang aktif
create policy "Public read active sessions"
  on spin_sessions for select
  using (is_active = true);

-- Claims: backend service role yang write (pakai service_role key)
create policy "Service role full access sessions"
  on spin_sessions for all
  using (auth.role() = 'service_role');

create policy "Service role full access claims"
  on spin_claims for all
  using (auth.role() = 'service_role');

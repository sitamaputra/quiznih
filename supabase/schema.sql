-- ============================================================
-- Quiznih — Master Schema (idempotent, safe to re-run)
-- Jalankan di: Supabase SQL Editor
-- Urutan: 001 → 002 → 003 → 004 → 005 → 006
-- ============================================================

-- ─── 001: Tabel Utama ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE,
  auth_id        UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username       TEXT,
  avatar_url     TEXT,
  total_score    BIGINT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS quizzes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_wallet         TEXT REFERENCES profiles(wallet_address) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  room_code           TEXT UNIQUE NOT NULL,
  reward_pool_amount  NUMERIC DEFAULT 0,
  status              TEXT DEFAULT 'waiting',
  contract_quiz_id    TEXT,
  deposit_status      TEXT DEFAULT 'none',
  deposit_tx          TEXT,
  escrow_balance      NUMERIC DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS questions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id              UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text        TEXT NOT NULL,
  options              JSONB NOT NULL,
  correct_answer_index INT NOT NULL,
  time_limit_seconds   INT DEFAULT 20,
  order_number         INT
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id        UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  user_wallet    TEXT NOT NULL,
  player_name    TEXT,
  final_score    INT DEFAULT 0,
  claimed_reward BOOLEAN DEFAULT false,
  claim_tx       TEXT,
  reward_amount  NUMERIC DEFAULT 0
);

-- Trigger: auto-buat profil saat user baru signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (auth_id, username, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── 002: Leaderboard — claim signature columns ──────────────────────────────

ALTER TABLE leaderboard
  ADD COLUMN IF NOT EXISTS rank             INT,
  ADD COLUMN IF NOT EXISTS claim_signature  TEXT,
  ADD COLUMN IF NOT EXISTS claim_amount_wei TEXT;

CREATE INDEX IF NOT EXISTS idx_leaderboard_quiz_wallet
  ON leaderboard (quiz_id, user_wallet);

CREATE INDEX IF NOT EXISTS idx_leaderboard_quiz_rank
  ON leaderboard (quiz_id, rank);

-- ─── 003: Spin Wheel ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS spin_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_address        TEXT NOT NULL,
  prize_pool          NUMERIC NOT NULL,
  prize_per_spin      NUMERIC NOT NULL,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  contract_session_id TEXT,
  tx_hash             TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ,
  closed_at           TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS spin_claims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES spin_sessions(id),
  player_address  TEXT NOT NULL,
  amount_wei      TEXT NOT NULL,
  signature       TEXT NOT NULL,
  claimed_onchain BOOLEAN NOT NULL DEFAULT false,
  tx_hash         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, player_address)
);

CREATE INDEX IF NOT EXISTS idx_spin_claims_session  ON spin_claims(session_id);
CREATE INDEX IF NOT EXISTS idx_spin_claims_player   ON spin_claims(player_address);
CREATE INDEX IF NOT EXISTS idx_spin_sessions_host   ON spin_sessions(host_address);
CREATE INDEX IF NOT EXISTS idx_spin_sessions_active ON spin_sessions(is_active) WHERE is_active = true;

ALTER TABLE spin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spin_claims   ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'spin_sessions' AND policyname = 'Public read active sessions'
  ) THEN
    CREATE POLICY "Public read active sessions"
      ON spin_sessions FOR SELECT USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'spin_sessions' AND policyname = 'Service role full access sessions'
  ) THEN
    CREATE POLICY "Service role full access sessions"
      ON spin_sessions FOR ALL USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'spin_claims' AND policyname = 'Service role full access claims'
  ) THEN
    CREATE POLICY "Service role full access claims"
      ON spin_claims FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ─── 004: Leaderboard — unique constraint ────────────────────────────────────

-- Hapus duplikat sebelum tambah constraint (aman jika tabel kosong)
DELETE FROM leaderboard a
USING leaderboard b
WHERE a.quiz_id = b.quiz_id
  AND a.user_wallet = b.user_wallet
  AND a.final_score < b.final_score;

DELETE FROM leaderboard a
USING leaderboard b
WHERE a.quiz_id = b.quiz_id
  AND a.user_wallet = b.user_wallet
  AND a.ctid > b.ctid;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leaderboard_quiz_wallet_unique'
  ) THEN
    ALTER TABLE leaderboard
      ADD CONSTRAINT leaderboard_quiz_wallet_unique UNIQUE (quiz_id, user_wallet);
  END IF;
END $$;

-- ─── 005: Leaderboard — is_finished ──────────────────────────────────────────

ALTER TABLE leaderboard
  ADD COLUMN IF NOT EXISTS is_finished BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_leaderboard_quiz_finished
  ON leaderboard (quiz_id, is_finished);

-- ─── 006: Spin Wheel — wheel_config ──────────────────────────────────────────

ALTER TABLE spin_sessions
  ADD COLUMN IF NOT EXISTS wheel_config JSONB;

-- ============================================================
-- Migration 001: Schema Utama Quiznih
-- Jalankan ini pertama kali di Supabase SQL Editor
-- ============================================================

-- 1. Profil User (wallet EVM / Celo)
CREATE TABLE IF NOT EXISTS profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE,
  auth_id        UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username       TEXT,
  avatar_url     TEXT,
  total_score    BIGINT DEFAULT 0,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Kuis (metadata + on-chain escrow)
CREATE TABLE IF NOT EXISTS quizzes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_wallet         TEXT REFERENCES profiles(wallet_address) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  room_code           TEXT UNIQUE NOT NULL,
  reward_pool_amount  NUMERIC DEFAULT 0,        -- dalam CELO
  status              TEXT DEFAULT 'waiting',   -- 'waiting' | 'playing' | 'finished'

  -- On-chain fields (QuizEscrow contract)
  contract_quiz_id    TEXT,                     -- bytes32 quiz ID di kontrak
  deposit_status      TEXT DEFAULT 'none',      -- 'none' | 'pending' | 'confirmed'
  deposit_tx          TEXT,                     -- tx hash deposit
  escrow_balance      NUMERIC DEFAULT 0,        -- saldo escrow saat ini (CELO)

  created_at          TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Soal kuis
CREATE TABLE IF NOT EXISTS questions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id              UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text        TEXT NOT NULL,
  options              JSONB NOT NULL,           -- ["Opsi A", "Opsi B", "Opsi C"]
  correct_answer_index INT NOT NULL,
  time_limit_seconds   INT DEFAULT 20,
  order_number         INT
);

-- 4. Leaderboard sesi + klaim hadiah on-chain
CREATE TABLE IF NOT EXISTS leaderboard (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id        UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  user_wallet    TEXT NOT NULL,                 -- EVM address (0x...)
  player_name    TEXT,
  final_score    INT DEFAULT 0,
  claimed_reward BOOLEAN DEFAULT false,

  -- On-chain claim fields
  claim_tx       TEXT,                          -- tx hash klaim hadiah
  reward_amount  NUMERIC DEFAULT 0             -- CELO yang diklaim
);

-- ============================================================
-- Fungsi & Trigger: auto-buat profil saat user baru signup
-- ============================================================

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

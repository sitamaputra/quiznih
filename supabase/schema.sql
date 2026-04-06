-- 1. Tabel Profil User (Berbasis Wallet Solana)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT,
  avatar_url TEXT,
  total_score BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Tabel Kuis (Metadata Utama + On-Chain Escrow)
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_wallet TEXT REFERENCES profiles(wallet_address) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  room_code TEXT UNIQUE NOT NULL,
  reward_pool_amount NUMERIC DEFAULT 0, -- Dalam SOL
  status TEXT DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
  
  -- Solana On-Chain Escrow Fields
  escrow_pubkey TEXT,            -- Public key of the escrow wallet
  escrow_secret TEXT,            -- Base64-encoded secret key (encrypt in production!)
  deposit_status TEXT DEFAULT 'none', -- 'none', 'pending', 'confirmed'
  deposit_tx TEXT,               -- Transaction signature of the deposit
  escrow_balance NUMERIC DEFAULT 0,  -- Current balance in the escrow
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Tabel Soal Kuis (Menggunakan JSONB untuk fleksibilitas opsi jawaban)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Contoh: ["Solana", "Ethereum", "Bitcoin"]
  correct_answer_index INT NOT NULL,
  time_limit_seconds INT DEFAULT 20,
  order_number INT -- Urutan soal
);

-- 4. Tabel Leaderboard Sesi (Data sementara hasil kuis + On-Chain Claim)
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  user_wallet TEXT NOT NULL,
  player_name TEXT,
  final_score INT DEFAULT 0,
  claimed_reward BOOLEAN DEFAULT false,
  
  -- On-Chain Claim Fields
  claim_tx TEXT,               -- Transaction signature of the reward claim
  reward_amount NUMERIC DEFAULT 0 -- Amount of SOL claimed
);

-- ============================================
-- MIGRATION: Run these ALTER statements if you
-- already have the tables from the old schema
-- ============================================

-- Add escrow columns to quizzes table
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS escrow_pubkey TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS escrow_secret TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'none';
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS deposit_tx TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS escrow_balance NUMERIC DEFAULT 0;

-- Add claim columns to leaderboard table
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS claim_tx TEXT;
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS reward_amount NUMERIC DEFAULT 0;

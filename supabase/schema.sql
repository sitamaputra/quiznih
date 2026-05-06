-- ============================================
-- Quiznih Database Schema (Celo Edition)
-- ============================================

-- 1. Tabel Profil User (Berbasis Wallet EVM / Celo)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL, -- EVM address format (0x...)
  username TEXT,
  avatar_url TEXT,
  total_score BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Tabel Kuis (Metadata Utama + On-Chain Escrow via QuizEscrow contract)
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_wallet TEXT REFERENCES profiles(wallet_address) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  room_code TEXT UNIQUE NOT NULL,
  reward_pool_amount NUMERIC DEFAULT 0, -- Dalam CELO
  status TEXT DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
  
  -- Celo On-Chain Escrow Fields
  contract_quiz_id TEXT,         -- bytes32 quiz ID on QuizEscrow contract
  deposit_status TEXT DEFAULT 'none', -- 'none', 'pending', 'confirmed'
  deposit_tx TEXT,               -- Transaction hash of the deposit
  escrow_balance NUMERIC DEFAULT 0,  -- Current balance in the escrow (CELO)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Tabel Soal Kuis (Menggunakan JSONB untuk fleksibilitas opsi jawaban)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Contoh: ["Celo", "Ethereum", "Bitcoin"]
  correct_answer_index INT NOT NULL,
  time_limit_seconds INT DEFAULT 20,
  order_number INT -- Urutan soal
);

-- 4. Tabel Leaderboard Sesi (Data sementara hasil kuis + On-Chain Claim)
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  user_wallet TEXT NOT NULL, -- EVM address (0x...)
  player_name TEXT,
  final_score INT DEFAULT 0,
  claimed_reward BOOLEAN DEFAULT false,
  
  -- On-Chain Claim Fields
  claim_tx TEXT,               -- Transaction hash of the reward claim
  reward_amount NUMERIC DEFAULT 0 -- Amount of CELO claimed
);

-- ============================================
-- MIGRATION: From Solana to Celo schema
-- Run these if you already have old Solana schema
-- ============================================

-- Remove old Solana-specific columns
ALTER TABLE quizzes DROP COLUMN IF EXISTS escrow_pubkey;
ALTER TABLE quizzes DROP COLUMN IF EXISTS escrow_secret;

-- Add new Celo-specific columns
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS contract_quiz_id TEXT;

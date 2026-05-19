-- ============================================================
-- Migration 002: Pull-payment claim flow
-- Tambahkan kolom untuk sistem winner claim mandiri
-- ============================================================

-- Tambah kolom ke leaderboard
ALTER TABLE leaderboard
  ADD COLUMN IF NOT EXISTS rank             INT,
  ADD COLUMN IF NOT EXISTS claim_signature  TEXT,
  ADD COLUMN IF NOT EXISTS claim_amount_wei TEXT; -- bigint disimpan sebagai text (wei)

-- Index untuk lookup cepat winner berdasarkan quiz + wallet
CREATE INDEX IF NOT EXISTS idx_leaderboard_quiz_wallet
  ON leaderboard (quiz_id, user_wallet);

-- Index untuk lookup top winners per quiz
CREATE INDEX IF NOT EXISTS idx_leaderboard_quiz_rank
  ON leaderboard (quiz_id, rank);

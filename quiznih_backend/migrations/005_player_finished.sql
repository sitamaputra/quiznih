-- ============================================================
-- Migration 005: Track when each player finishes all questions
-- Used for auto-finish logic in control room
-- ============================================================

ALTER TABLE leaderboard
  ADD COLUMN IF NOT EXISTS is_finished BOOLEAN DEFAULT false;

-- Index untuk cek cepat apakah semua player sudah selesai
CREATE INDEX IF NOT EXISTS idx_leaderboard_quiz_finished
  ON leaderboard (quiz_id, is_finished);

-- ============================================================
-- Migration 004: Add UNIQUE constraint on leaderboard(quiz_id, user_wallet)
-- Fixes duplicate rows causing .single() to fail on claim
-- ============================================================

-- Step 1: Remove duplicate rows — keep the row with the highest final_score
-- (or the latest created if scores are tied, using ctid as tiebreaker)
DELETE FROM leaderboard a
USING leaderboard b
WHERE a.quiz_id = b.quiz_id
  AND a.user_wallet = b.user_wallet
  AND a.final_score < b.final_score;

-- Step 2: Remove any remaining duplicates (same score) keeping smallest ctid
DELETE FROM leaderboard a
USING leaderboard b
WHERE a.quiz_id = b.quiz_id
  AND a.user_wallet = b.user_wallet
  AND a.ctid > b.ctid;

-- Step 3: Add UNIQUE constraint
ALTER TABLE leaderboard
  ADD CONSTRAINT leaderboard_quiz_wallet_unique UNIQUE (quiz_id, user_wallet);

-- ============================================================
-- Seed: Data dummy untuk development
-- Jalankan SETELAH migration 001_schema.sql
-- ============================================================

-- Profile dummy
INSERT INTO profiles (wallet_address, username, total_score) VALUES
  ('0x1111111111111111111111111111111111111111', 'alice.celo', 12450),
  ('0x2222222222222222222222222222222222222222', 'bob.eth', 9800),
  ('0x3333333333333333333333333333333333333333', 'carol_web3', 7300)
ON CONFLICT (wallet_address) DO NOTHING;

-- Quiz dummy
INSERT INTO quizzes (host_wallet, title, description, room_code, status) VALUES
  ('0x1111111111111111111111111111111111111111', 'Kuis Blockchain Dasar', 'Uji pengetahuan blockchain kamu!', 'DEMO01', 'waiting'),
  ('0x2222222222222222222222222222222222222222', 'Celo & DeFi Quiz', 'Quiz seputar ekosistem Celo', 'DEMO02', 'finished')
ON CONFLICT (room_code) DO NOTHING;

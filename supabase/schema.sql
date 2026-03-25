-- 1. Tabel Profil User (Berbasis Wallet Solana)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT,
  avatar_url TEXT,
  total_score BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Tabel Kuis (Metadata Utama)
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_wallet TEXT REFERENCES profiles(wallet_address) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  room_code TEXT UNIQUE NOT NULL,
  reward_pool_amount NUMERIC DEFAULT 0, -- Dalam SOL
  status TEXT DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
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

-- 4. Tabel Leaderboard Sesi (Data sementara hasil kuis)
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  user_wallet TEXT NOT NULL,
  player_name TEXT,
  final_score INT DEFAULT 0,
  claimed_reward BOOLEAN DEFAULT false
);

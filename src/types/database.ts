export type Profile = {
  id: string; // UUID
  wallet_address: string;
  username: string | null;
  avatar_url: string | null;
  total_score: number;
  created_at: string;
};

export type Quiz = {
  id: string; // UUID
  host_id: string;
  title: string;
  description: string | null;
  reward_pool_amount: number;
  is_active: boolean;
  created_at: string;
};

export type Question = {
  id: string; // UUID
  quiz_id: string;
  question_text: string;
  options: string[]; // JSONB mapped to string array
  correct_answer_index: number;
  time_limit_seconds: number;
  order_number: number | null;
};

export type LeaderboardEntry = {
  id: string; // UUID
  quiz_id: string;
  user_wallet: string;
  final_score: number;
  claimed_reward: boolean;
};

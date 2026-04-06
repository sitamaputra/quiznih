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
  host_wallet: string;
  title: string;
  description: string | null;
  room_code: string;
  reward_pool_amount: number;
  status: "waiting" | "playing" | "finished";

  // Solana On-Chain Escrow
  escrow_pubkey: string | null;
  escrow_secret: string | null;
  deposit_status: "none" | "pending" | "confirmed";
  deposit_tx: string | null;
  escrow_balance: number;

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
  player_name: string | null;
  final_score: number;
  claimed_reward: boolean;

  // On-Chain Claim
  claim_tx: string | null;
  reward_amount: number;
};

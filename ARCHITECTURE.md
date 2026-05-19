# Quiznih — Architecture Overview

> Web3 quiz & spin-wheel platform on **Celo Mainnet**.
> Hosts deposit CELO rewards; winners claim directly from smart contracts — no manual distribution.

---

## Monorepo Structure

```
quiznih/
├── quiznih_frontend/        # Next.js 16 app (App Router)
├── quiznih_backend/         # Supabase migrations & seeds
├── quiznih_smartcontract/   # Solidity contracts + Foundry tests + bot scripts
├── docs/                    # PRD & project overview
└── supabase/                # Supabase project config
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.1 (App Router, Turbopack), React 19 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion 12, canvas-confetti |
| Web3 client | Wagmi v3 + Viem v2 |
| Auth & DB | Supabase (PostgreSQL + Auth + Realtime) |
| Blockchain | **Celo Mainnet** (chain ID 42220) |
| Testnet | Celo Sepolia (chain ID 11142220) |
| Smart Contracts | Solidity ^0.8.20, OpenZeppelin v5, Foundry |
| Deploy | Vercel (frontend), Foundry scripts (contracts) |

---

## Network Config (`quiznih_frontend/src/lib/celo.ts`)

```
IS_TESTNET = false   → Celo Mainnet  (RPC: https://forno.celo.org)
IS_TESTNET = true    → Celo Sepolia  (RPC: https://celo-sepolia.drpc.org)
```

Contract addresses are read from environment variables:
```
NEXT_PUBLIC_QUIZ_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_SPIN_WHEEL_ADDRESS=0x...
```

---

## Smart Contracts

Located in `quiznih_smartcontract/apps/contracts/src/`.
Both contracts are **UUPS Upgradeable** via OpenZeppelin v5 + ERC1967Proxy.

### QuizEscrow.sol

Escrow contract for quiz reward pools.

| Function | Who calls | Description |
|---|---|---|
| `createQuizAndDeposit(quizId, roomCode)` | Host | Deposit CELO reward pool — only on-chain action host needs to do |
| `addToRewardPool(quizId)` | Host | Top up pool before quiz starts |
| `cancelQuiz(quizId)` | Host | Refund full pool (only before finalized) |
| `finalizeQuiz(quizId)` | Backend signer | Mark quiz ended, open 30-day claim window |
| `claimReward(quizId, amount, signature)` | Winner | Claim CELO using backend-signed authorization |
| `reclaimExpiredFunds(quizId)` | Host | Reclaim unclaimed funds after 30-day window |
| `setSigner(address)` | Owner | Update trusted backend signer |

**Reward split:** 1st 50% / 2nd 30% / 3rd 20%

**Claim flow:**
```
Host deposit → quiz runs off-chain → backend signs winner claims
→ each winner calls claimReward() independently → CELO sent to wallet
```

**Security:** ReentrancyGuard, CEI pattern, ECDSA signature verification,
cross-contract replay protection via `address(this)` + `block.chainid` in hash.

---

### SpinWheel.sol

Per-slice CELO reward contract for spin wheel sessions.

| Function | Who calls | Description |
|---|---|---|
| `createSession(sessionId, slices, amounts)` | Host | Create session and deposit CELO per slice |
| `closeSession(sessionId)` | Host | Close session, refund unclaimed slices |
| `claimSpin(sessionId, sliceIndex, signature)` | Player | Claim a slice reward with backend signature |

**Claim flow:**
```
Host create session + deposit → player spins (off-chain RNG) → backend signs result
→ player calls claimSpin() → CELO sent to wallet
```

---

## Database Schema (Supabase / PostgreSQL)

Migrations in `quiznih_backend/migrations/`.

### `profiles`
```
id · wallet_address (unique) · auth_id · username · avatar_url · total_score
```

### `quizzes`
```
id · host_wallet · title · description · room_code (unique)
reward_pool_amount · status: waiting|playing|finished
contract_quiz_id · deposit_status: none|pending|confirmed · deposit_tx · escrow_balance
```

### `questions`
```
id · quiz_id (FK) · question_text · options (JSONB) · correct_answer_index
time_limit_seconds · order_number
```

### `leaderboard`
```
id · quiz_id (FK) · user_wallet · player_name · final_score
rank · reward_amount · claim_amount_wei · claim_signature
claimed_reward · claim_tx
```

### `spin_sessions`
```
id · host_wallet · session_id (on-chain) · status: open|closed
total_slices · celo_per_slice · contract_address
```

### `spin_results`
```
id · session_id (FK) · player_wallet · slice_index
claim_signature · claimed · claim_tx
```

---

## Frontend Pages & API Routes

### Pages (`quiznih_frontend/src/app/`)

| Route | File | Description |
|---|---|---|
| `/` | `page.tsx` | Landing page — hero, how it works, leaderboard |
| `/dashboard` | `dashboard/page.tsx` | Role selector: Quiz Creator vs Player |
| `/create` | `create/page.tsx` | Quiz builder: questions, reward pool deposit |
| `/create/room/[id]` | `create/room/[id]/page.tsx` | Host control room — start quiz, finalize & open claims |
| `/play` | `play/page.tsx` | Player join → answer → claim CELO reward |
| `/manage` | `manage/page.tsx` | Host quiz management list |
| `/spin` | `spin/page.tsx` | Host spin wheel — create session, deposit per slice |
| `/spin/[sessionId]` | `spin/[sessionId]/page.tsx` | Player spin & claim CELO per slice |
| `/live` | `live/page.tsx` | Live quiz dashboard view |
| `/qa` | `qa/page.tsx` | Q&A page |

### API Routes (`quiznih_frontend/src/app/api/`)

| Route | Description |
|---|---|
| `POST /api/quiz/deposit` | Record on-chain deposit tx to Supabase |
| `POST /api/quiz/confirm-deposit` | Verify tx hash via viem `getTransactionReceipt` |
| `POST /api/quiz/finalize` | Sign winner claims (ECDSA) + call `finalizeQuiz()` on-chain |
| `POST /api/quiz/claim-reward` | Record successful claim to Supabase after on-chain tx |
| `POST /api/spin/session` | Create / close spin session in Supabase |
| `POST /api/spin/request` | Sign player spin result — returns ECDSA signature for `claimSpin()` |
| `POST /api/spin/claim` | Record spin claim to Supabase after on-chain tx |

---

## Key Libraries & Hooks

| File | Purpose |
|---|---|
| `src/lib/celo.ts` | Chain config, contract addresses, ABI exports, utilities |
| `src/lib/wagmi.ts` | Wagmi config + wallet connectors (MetaMask, Rabby, OKX, Bitget, Trust, MiniPay) |
| `src/lib/supabase.ts` | Supabase client singleton |
| `src/lib/translations.ts` | EN / ID bilingual strings |
| `src/hooks/useCeloQuiz.ts` | All on-chain write actions: deposit, cancel, claimReward |
| `src/context/LanguageContext.tsx` | Global EN ↔ ID toggle |

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server-only (API routes)

# Celo Smart Contracts
NEXT_PUBLIC_QUIZ_ESCROW_ADDRESS= # QuizEscrow proxy address (Celo Mainnet)
NEXT_PUBLIC_SPIN_WHEEL_ADDRESS=  # SpinWheel proxy address (Celo Mainnet)

# Backend Signer (server-only — NEVER expose to client)
SIGNER_PRIVATE_KEY=              # Private key of trustedSigner wallet
                                 # Signs winner claims; wallet needs ~0.01 CELO for gas

# Optional
NEXT_PUBLIC_WC_PROJECT_ID=       # WalletConnect project ID
```

> **Note:** `SIGNER_PRIVATE_KEY` is a dedicated backend-only wallet.
> It does **not** hold user funds — only used to authorize winner claims on-chain.
> Store in `.env.local` (never commit).

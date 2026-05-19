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

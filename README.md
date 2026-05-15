# Quiznih — Web3 Quiz Platform on Celo

**Quiznih** is an interactive Web3 quiz platform built on the **Celo** blockchain. Hosts create real-time quiz sessions with **CELO reward pools** locked in a smart contract escrow (`QuizEscrow.sol`). Players join via room code or QR code, answer questions with a timer, and top 3 winners automatically receive on-chain rewards (1st: 50%, 2nd: 30%, 3rd: 20%).

> Full PRD: [`docs/PRD.md`](docs/PRD.md) | Project Overview: [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md)

---

## Repository Structure

```
quiznih/
├── quiznih_frontend/       # Next.js 16 app (App Router, Tailwind v4, Wagmi v3)
├── quiznih_backend/        # Supabase schema, migrations, seeds
├── quiznih_smartcontract/  # Solidity smart contract (QuizEscrow.sol)
├── docs/                   # PRD & project documentation
└── supabase/               # Supabase config & SQL
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.1 (App Router), React 19 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion 12, canvas-confetti |
| Web3 | Wagmi v3 + Viem v2 |
| Auth & DB | Supabase (PostgreSQL + Auth + Realtime) |
| Blockchain | Celo Mainnet / Alfajores Testnet |
| Smart Contract | Solidity ^0.8.20 |
| Deploy | Vercel (frontend), Celo (contract) |

---

## Getting Started

### Frontend

```bash
cd quiznih_frontend
npm install
cp .env.example .env.local  # fill in your env vars
npm run dev
```

### Smart Contract

```bash
cd quiznih_smartcontract
npm install
# deploy to Alfajores testnet
```

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_QUIZ_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_WC_PROJECT_ID=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Product Requirements Document (PRD)

### Executive Summary

Quiznih combines **Kahoot-style UX** (live multiplayer quiz) with Web3 transparency and incentives. It supports multi-wallet (MetaMask, Rabby, OKX, Bitget, Trust) plus **MiniPay auto-connect** for mobile-first users in Africa & Southeast Asia.

**Value Proposition:**
- **For Hosts**: Easy & transparent way to run on-chain giveaway/education sessions without manual fund management risk.
- **For Players**: Earn-to-learn — play a quiz, answer correctly, claim CELO directly to wallet.
- **For Communities**: Web3-native engagement tool for DAOs, crypto communities, and blockchain education classes.

### Problem Statement

1. Traditional quiz platforms (Kahoot, Quizizz) have no real rewards — high engagement but no transparent monetary incentives.
2. Manual crypto giveaways are scam-prone & high friction — hosts must send manually, winners are unsure.
3. Web3 onboarding is difficult — blockchain education tools need to also teach transaction signing & wallet usage.
4. Mobile-first market underserved — many Celo/MiniPay users in Africa lack access to lightweight crypto giveaway platforms.

### Goals (90-day Metrics)

| ID | Goal | Success Metric |
|---|---|---|
| G1 | Launch stable MVP on Celo Mainnet | Zero critical bugs 30 days post-launch |
| G2 | Frictionless Web3 onboarding | <30s from landing → join quiz for MiniPay users |
| G3 | 100% on-chain automatic reward distribution | 0 manual interventions for reward distribution |
| G4 | Organic engagement | 1,000 unique wallets/week after month 3 |

### Key User Stories

**Host:**
- Connect wallet → create quiz with title, questions, CELO reward pool
- Share via 6-digit room code + QR code
- Start quiz, view real-time leaderboard, distribute rewards to top 3

**Player:**
- Scan QR or enter room code → pick avatar & nickname → connect wallet
- Answer questions with countdown timer (score = 100 base + timeLeft × 10 bonus)
- View final leaderboard with confetti → claim CELO reward if top 3

### Smart Contract: `QuizEscrow.sol`

```solidity
function createQuizAndDeposit(bytes32 _quizId, string calldata _roomCode) external payable;
function distributeRewards(bytes32 _quizId, address[] calldata _winners) external; // host only
function cancelQuiz(bytes32 _quizId) external; // host only, full refund
function getQuizInfo(bytes32 _quizId) external view returns (...);
```

Default reward distribution: **1st 50% / 2nd 30% / 3rd 20%**

Security: ReentrancyGuard, Ownable, CHECKS-EFFECTS-INTERACTIONS pattern, no `tx.origin`.

### Database Schema (Supabase)

- **`quizzes`** — quiz metadata, room code, reward pool, status, on-chain ref
- **`questions`** — question text, options (JSONB), correct answer, time limit
- **`leaderboard`** — player wallet, score, claim status, reward amount
- **`profiles`** — wallet address, username, total lifetime score

### Roadmap

**Phase 0 — Foundation ✅**
- Next.js 16 + Tailwind v4 setup
- Wagmi multi-wallet (5 wallets + MiniPay)
- Supabase schema + `QuizEscrow.sol` contract draft
- Bilingual UI (EN/ID) + dark mode

**Phase 1 — MVP Polish (Current)**
- Supabase RLS policies finalize
- Smart contract unit tests (Foundry/Hardhat, coverage >90%)
- Deploy `QuizEscrow.sol` to Alfajores + verify
- End-to-end test: create → deposit → play → distribute

**Phase 2 — Production Ready**
- External smart contract audit
- Deploy to Celo Mainnet
- Rate limiting (Upstash/Vercel KV)
- PostHog analytics + Sentry error monitoring

**Phase 3 — Growth**
- cUSD/cEUR stablecoin reward support
- AI question generator (in-app)
- Template marketplace
- Team/DAO multi-host support

---

## Network Config

| Network | RPC | Purpose |
|---|---|---|
| Celo Mainnet | `https://forno.celo.org` | Production |
| Celo Alfajores | `https://alfajores-forno.celo-testnet.org` | Development |

---

*For full technical specification, see [`docs/PRD.md`](docs/PRD.md)*

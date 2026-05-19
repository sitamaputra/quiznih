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

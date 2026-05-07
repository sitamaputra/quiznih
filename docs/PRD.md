# Product Requirements Document (PRD)
## Quiznih — Web3 Quiz Platform di Celo

| Field | Value |
| --- | --- |
| Document Version | 1.0 |
| Last Updated | 2026-05-06 |
| Status | Draft |
| Owner | Product / Engineering |
| Code Name | Quiznih (Celo Edition) |
| Repository | `BUILD PROJECT/quiznih` |

---

## 1. Executive Summary

**Quiznih** adalah platform kuis interaktif berbasis Web3 yang berjalan di blockchain **Celo**. Host (pembuat kuis) dapat membuat sesi kuis real-time dengan **reward pool dalam CELO** yang dikunci di smart contract escrow (`QuizEscrow.sol`). Pemain bergabung lewat **room code** atau **QR code**, menjawab soal dengan timer, dan pemenang otomatis menerima reward on-chain (juara 1: 50%, juara 2: 30%, juara 3: 20%).

Quiznih menggabungkan UX **Kahoot-style** (kuis live multiplayer) dengan transparansi & insentif Web3. Mendukung multi-wallet (MetaMask, Rabby, OKX, Bitget, Trust) plus **MiniPay auto-connect** untuk pengguna mobile-first di pasar Afrika & Asia Tenggara.

### Value Proposition
- **Untuk Host**: Cara mudah & transparan menjalankan giveaway / edukasi berhadiah on-chain tanpa risiko fund management manual.
- **Untuk Pemain**: Earn-to-learn — main kuis, jawab benar, claim CELO langsung ke wallet.
- **Untuk Komunitas**: Tool engagement Web3-native untuk DAO, komunitas crypto, dan kelas edukasi blockchain.

---

## 2. Problem Statement

### 2.1 Masalah yang Diselesaikan
1. **Quiz platform tradisional (Kahoot, Quizizz) tidak punya hadiah riil** — engagement tinggi tapi tidak ada insentif moneter yang transparan.
2. **Giveaway crypto manual rawan scam & friksi** — host harus kirim manual, ada risiko sengaja "lupa", pemenang tidak yakin.
3. **Onboarding Web3 sulit** — kuis edukasi blockchain butuh tooling yang sekaligus mengajarkan signing transaksi & wallet usage.
4. **Mobile-first market underserved** — banyak pengguna Celo / MiniPay di Afrika tidak punya akses platform giveaway crypto yang ringan.

### 2.2 Kenapa Sekarang
- Celo + MiniPay punya 5M+ active wallet di Afrika (target market growing).
- Stablecoin payment di Celo (cUSD, cEUR) memungkinkan reward bernilai stabil.
- Kompetisi & ekosistem Celo butuh dApp engagement untuk retention.

---

## 3. Goals & Objectives

### 3.1 Goals (Outcome)
| ID | Goal | Metric Sukses (90 hari) |
| --- | --- | --- |
| G1 | Launch MVP yang stabil di Celo Mainnet | Zero critical bug 30 hari pasca launch |
| G2 | Onboarding Web3 yang frictionless | <30 detik dari landing → join quiz untuk MiniPay user |
| G3 | Reward distribution 100% on-chain & otomatis | 0 manual intervention untuk distribusi reward |
| G4 | Engagement organik | 1.000 unique wallet per minggu setelah bulan ke-3 |

### 3.2 Non-Goals (Out of Scope MVP)
- Mobile native app (iOS/Android) — pakai PWA dulu.
- Multi-chain di luar Celo (Ethereum, Polygon, Solana) — fokus Celo dulu.
- Marketplace pembelian template kuis berbayar.
- AI auto-grading untuk soal essay (MVP: multiple-choice only).

---

## 4. Target Users & Personas

### 4.1 Persona 1 — "Host Edukator" (Pak Andi)
- Guru / content creator crypto, umur 28–40
- Tujuan: edukasi audience tentang Web3 sambil reward partisipasi
- Frustration: bingung cara kirim reward 1-by-1 ke 50 peserta
- Tech: punya MetaMask, paham basic gas fee
- **Job-to-be-done**: "Saya ingin jalankan quiz edukasi 10 soal dengan hadiah 50 CELO total dalam <5 menit setup."

### 4.2 Persona 2 — "Player Kasual" (Sari)
- Mahasiswa, umur 19–25, mobile-first
- Tujuan: dapat reward dari main kuis di kelas/komunitas
- Frustration: tidak mau install banyak app
- Tech: pakai MiniPay (Opera), belum pernah signing manual
- **Job-to-be-done**: "Scan QR → jawab soal → reward masuk wallet, tanpa drama."

### 4.3 Persona 3 — "Community Manager" (DAO / Brand)
- Marketing crypto project / DAO
- Tujuan: engagement campaign berhadiah token
- Frustration: butuh proof on-chain untuk transparansi distribusi
- Tech: punya multisig wallet, paham smart contract
- **Job-to-be-done**: "Saya ingin run AMA quiz dengan 500 CELO reward pool, dan setiap distribusi harus auditable di Celoscan."

---

## 5. User Stories & Use Cases

### 5.1 Epic: Host Membuat Kuis
- **US-H1**: Sebagai host, saya bisa connect wallet (MetaMask/Rabby/OKX/Bitget/Trust/MiniPay) ke aplikasi.
- **US-H2**: Sebagai host, saya bisa membuat kuis baru dengan judul, deskripsi, dan list soal multiple choice.
- **US-H3**: Sebagai host, saya bisa generate soal via AI prompt (import JSON).
- **US-H4**: Sebagai host, saya bisa pakai template preset (Crypto 101, Blockchain History, dll).
- **US-H5**: Sebagai host, saya bisa set reward pool dalam CELO dan deposit ke escrow contract.
- **US-H6**: Sebagai host, saya bisa share quiz lewat room code 6-digit + QR code.
- **US-H7**: Sebagai host, saya bisa lihat realtime leaderboard di waiting room sebelum start.
- **US-H8**: Sebagai host, saya bisa start quiz manual ketika peserta cukup.
- **US-H9**: Sebagai host, saya bisa cancel quiz dan dapat refund full ke wallet.
- **US-H10**: Sebagai host, saya bisa distribute reward ke top 3 winner setelah quiz selesai.

### 5.2 Epic: Player Bermain Kuis
- **US-P1**: Sebagai player, saya bisa scan QR atau input room code 6-digit.
- **US-P2**: Sebagai player, saya bisa pilih avatar dan masukkan nickname.
- **US-P3**: Sebagai player, saya bisa connect wallet (auto MiniPay / manual) sebelum mulai.
- **US-P4**: Sebagai player, saya bisa lihat soal dengan timer (default 20 detik).
- **US-P5**: Sebagai player, saya dapat bonus poin untuk jawaban cepat (`100 + timeLeft × 10`).
- **US-P6**: Sebagai player, saya bisa lihat reveal jawaban benar setelah timer habis.
- **US-P7**: Sebagai player, saya bisa lihat leaderboard final dengan animasi confetti.
- **US-P8**: Sebagai player top 3, saya bisa claim reward CELO ke wallet saya.

### 5.3 Epic: Auth & Profile
- **US-A1**: Sebagai user, saya bisa sign in via email/password (Supabase Auth).
- **US-A2**: Sebagai user, saya bisa sign in via Google OAuth.
- **US-A3**: Sebagai user, saya bisa connect wallet sebagai metode auth alternatif (Web3-only mode).
- **US-A4**: Sebagai user, saya bisa toggle bahasa antara English & Indonesia.
- **US-A5**: Sebagai user, saya bisa toggle dark / light mode.

---

## 6. Functional Requirements

### 6.1 Modul Authentication
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-AUTH-01 | Sign in dengan email + password (Supabase Auth) | P0 |
| FR-AUTH-02 | Sign up dengan email + password + nickname | P0 |
| FR-AUTH-03 | OAuth Google | P1 |
| FR-AUTH-04 | Wallet connect (5 wallets + MiniPay auto) | P0 |
| FR-AUTH-05 | Auto-detect MiniPay (`window.ethereum.isMiniPay`) dan auto-connect | P0 |
| FR-AUTH-06 | Session persistence (Supabase session + Wagmi cookies) | P0 |
| FR-AUTH-07 | Sign out membersihkan kedua sesi (Web2 + Web3) | P0 |

### 6.2 Modul Quiz Creation
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-CREATE-01 | Form metadata: title (req), description (opt) | P0 |
| FR-CREATE-02 | Question builder: add/remove/reorder soal | P0 |
| FR-CREATE-03 | Setiap soal: text + 2–6 opsi + correct index + time limit (10/20/30/60s) | P0 |
| FR-CREATE-04 | Reward type selector: CELO on-chain ATAU merchandise off-chain | P0 |
| FR-CREATE-05 | Set reward pool amount dalam CELO | P0 |
| FR-CREATE-06 | Generate room code unique 6-digit alfanumerik | P0 |
| FR-CREATE-07 | JSON import panel + AI prompt generator helper | P1 |
| FR-CREATE-08 | Template preset (minimal 3: Crypto 101, History, Tech) | P2 |
| FR-CREATE-09 | Preview soal sebelum publish | P1 |
| FR-CREATE-10 | Publish: insert ke `quizzes` + `questions` + (jika CELO) panggil `createQuizAndDeposit` | P0 |
| FR-CREATE-11 | QR code generator dari room URL | P0 |

### 6.3 Modul Quiz Play
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-PLAY-01 | Join via room code 6-digit | P0 |
| FR-PLAY-02 | Join via QR scan (camera akses) | P1 |
| FR-PLAY-03 | Avatar picker (8+ pilihan emoji/icon) + nickname input | P0 |
| FR-PLAY-04 | Realtime waiting room (Supabase Realtime channel) | P0 |
| FR-PLAY-05 | Question display dengan timer countdown visual | P0 |
| FR-PLAY-06 | Submit jawaban; lock setelah click | P0 |
| FR-PLAY-07 | Scoring: 100 base + (timeLeft × 10) bonus untuk jawaban benar | P0 |
| FR-PLAY-08 | Auto-advance ke soal berikutnya 3 detik setelah reveal | P0 |
| FR-PLAY-09 | Final screen: leaderboard top 10 + confetti winner | P0 |
| FR-PLAY-10 | Top 3: tombol "Claim Reward" memicu on-chain tx (host distribute) | P0 |
| FR-PLAY-11 | Demo mode (room code `123456`) tanpa Supabase | P2 |

### 6.4 Modul On-Chain (Smart Contract)
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-CHAIN-01 | `createQuizAndDeposit(bytes32 quizId, string roomCode)` payable — host deposit reward | P0 |
| FR-CHAIN-02 | `addToRewardPool(bytes32 quizId)` payable — top up reward | P1 |
| FR-CHAIN-03 | `distributeRewards(bytes32 quizId, address[] winners)` — split 50/30/20 ke top 3 | P0 |
| FR-CHAIN-04 | `cancelQuiz(bytes32 quizId)` — host refund 100% | P0 |
| FR-CHAIN-05 | `getQuizInfo(bytes32 quizId)` view — return host/pool/active/distributed/roomCode | P0 |
| FR-CHAIN-06 | Events: `QuizCreated`, `RewardDeposited`, `RewardDistributed`, `QuizCancelled` | P0 |
| FR-CHAIN-07 | Owner control: `transferOwnership`, `updateRewardDistribution` | P1 |
| FR-CHAIN-08 | Reentrancy guard pada semua external functions | P0 |

### 6.5 Modul Realtime & State Sync
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-RT-01 | Supabase Realtime subscribe ke channel `quiz:{roomCode}` | P0 |
| FR-RT-02 | Broadcast event: `player_joined`, `quiz_started`, `question_changed`, `answer_revealed`, `quiz_finished` | P0 |
| FR-RT-03 | Host punya autoritas state — player listen-only kecuali submit jawaban | P0 |
| FR-RT-04 | Reconnect handling — player rejoin setelah disconnect <30s | P1 |

### 6.6 Modul i18n & Theming
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-I18N-01 | Toggle bahasa ENG / IND, persist di localStorage | P0 |
| FR-I18N-02 | Semua UI string di-translate (tidak ada hardcoded string Bahasa) | P0 |
| FR-I18N-03 | Toggle dark / light mode (next-themes), default: system | P0 |

---

## 7. Non-Functional Requirements

### 7.1 Performance
- **First Contentful Paint** < 1.5s pada koneksi 3G fast.
- **Time to Interactive** < 3s.
- **Realtime latency** broadcast event <500ms regional (asia-southeast).
- **On-chain tx feedback** <2s setelah confirm wallet.

### 7.2 Reliability & Availability
- Target uptime **99.5%** (Vercel + Supabase SLA).
- Graceful degradation: jika Supabase down, frontend tampilkan banner & disable create/join.
- Smart contract immutable & audited sebelum mainnet deploy.

### 7.3 Security
- **Smart contract**: ReentrancyGuard, Ownable, full test coverage (Foundry/Hardhat). Audit eksternal sebelum mainnet.
- **Frontend**: tidak pernah simpan private key. Hanya address public yang disimpan di Supabase.
- **Supabase RLS**: enforce row-level security — user hanya bisa update record miliknya.
- **Rate limiting**: max 10 quiz creations / wallet / 24 jam (anti-spam).
- **Input sanitization**: question text & options di-escape sebelum render.
- **No private data in URL**: tidak ada token/auth key di query string.

### 7.4 Scalability
- Database design support 10.000 concurrent active quiz sessions.
- Realtime channels di-shard per room code.
- Static assets via Vercel CDN.

### 7.5 Accessibility
- WCAG 2.1 AA compliance untuk navigation utama.
- Keyboard navigation untuk semua action utama.
- Color contrast ratio ≥ 4.5:1.
- ARIA labels untuk button & icon.

### 7.6 Browser & Device Support
- Chrome / Edge / Firefox / Safari (2 versi terakhir).
- iOS Safari 15+, Chrome Android.
- **MiniPay (Opera Mini)** — first-class citizen.
- Responsive: 320px (mobile S) → 1920px (desktop L).

---

## 8. Technical Architecture

### 8.1 Stack
| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16.2.1 (App Router, Turbopack), React 19 |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Animation | framer-motion 12, canvas-confetti |
| State | React hooks + Wagmi v3 + TanStack Query |
| Web3 | Wagmi v3 + Viem v2 |
| Auth & DB | Supabase (PostgreSQL + Auth + Realtime) |
| Blockchain | Celo Mainnet (prod) / Alfajores (dev) |
| Smart Contract | Solidity ^0.8.20 (`QuizEscrow.sol`) |
| Deploy FE | Vercel |
| Deploy SC | Hardhat / Foundry → Celo |

### 8.2 High-Level Architecture
```
┌─────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Browser       │◄────►│  Next.js (Vercel)│◄────►│  Supabase        │
│   (Wallet)      │      │  - SSR / RSC     │      │  - Postgres      │
│                 │      │  - Client comp   │      │  - Realtime      │
└────────┬────────┘      └──────────────────┘      │  - Auth          │
         │                                          └──────────────────┘
         │ JSON-RPC / WalletConnect
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Celo RPC       │◄────►│ QuizEscrow.sol   │
│  (Forno)        │      │ Smart Contract   │
└─────────────────┘      └──────────────────┘
```

### 8.3 File / Folder Convention
- `src/app/` — Next.js App Router pages (`page.tsx`, `layout.tsx`)
- `src/components/` — Reusable UI components
- `src/context/` — React Context (Language, Theme)
- `src/hooks/` — Custom hooks (`useCeloQuiz`, `useSupabase`)
- `src/lib/` — Lib & utilities (`celo.ts`, `wagmi.ts`, `supabase.ts`)
- `supabase/` — Schema SQL & migrations
- `contracts/` — Solidity source

### 8.4 Critical Project Convention (from AGENTS.md)
> **This is NOT the Next.js you know.** This version (16.2.1) has breaking changes — APIs, conventions, and file structure may differ from training data. Always read the relevant guide in `node_modules/next/dist/docs/` before writing new Next.js code. Heed deprecation notices.

---

## 9. Data Model

### 9.1 Database Schema (Supabase / PostgreSQL)

#### `profiles`
| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | `gen_random_uuid()` |
| wallet_address | TEXT UNIQUE NOT NULL | EVM `0x...` |
| username | TEXT | Optional display name |
| avatar_url | TEXT | URL avatar |
| total_score | BIGINT DEFAULT 0 | Akumulasi skor lifetime |
| created_at | TIMESTAMPTZ | UTC default |

#### `quizzes`
| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| host_wallet | TEXT FK → profiles.wallet_address | Cascade delete |
| title | TEXT NOT NULL | |
| description | TEXT | |
| room_code | TEXT UNIQUE NOT NULL | 6-digit join code |
| reward_pool_amount | NUMERIC DEFAULT 0 | CELO amount |
| status | TEXT DEFAULT 'waiting' | enum: waiting/playing/finished |
| contract_quiz_id | TEXT | bytes32 on contract |
| deposit_status | TEXT DEFAULT 'none' | none/pending/confirmed |
| deposit_tx | TEXT | tx hash |
| escrow_balance | NUMERIC DEFAULT 0 | current pool |
| created_at | TIMESTAMPTZ | |

#### `questions`
| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| quiz_id | UUID FK → quizzes.id | Cascade delete |
| question_text | TEXT NOT NULL | |
| options | JSONB NOT NULL | Array string |
| correct_answer_index | INT NOT NULL | 0-based |
| time_limit_seconds | INT DEFAULT 20 | |
| order_number | INT | Display order |

#### `leaderboard`
| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| quiz_id | UUID FK → quizzes.id | Cascade delete |
| user_wallet | TEXT NOT NULL | EVM address |
| player_name | TEXT | Nickname session |
| final_score | INT DEFAULT 0 | |
| claimed_reward | BOOLEAN DEFAULT false | |
| claim_tx | TEXT | tx hash claim |
| reward_amount | NUMERIC DEFAULT 0 | CELO |

### 9.2 RLS (Row Level Security) Policies (TODO)
- `profiles`: SELECT public, UPDATE only own row
- `quizzes`: SELECT public, INSERT auth-only, UPDATE only host_wallet=auth.wallet
- `questions`: SELECT public, INSERT only quiz host
- `leaderboard`: SELECT public, INSERT auth, UPDATE only own row

### 9.3 On-Chain State (`QuizEscrow.sol`)
```solidity
struct Quiz {
  address host;
  uint256 rewardPool;
  bool isActive;
  bool isDistributed;
  string roomCode;
}
mapping(bytes32 => Quiz) public quizzes;
```

---

## 10. UI / UX Requirements

### 10.1 Design System
- **Color Palette**: Celo green `#35D07F`, Celo yellow `#FCFF52`, neutral black/white.
- **Font**: `Outfit` (Google Fonts).
- **Border radius**: rounded-2xl untuk card, rounded-xl untuk button.
- **Animation**: framer-motion entry stagger (idx × 0.05s delay).
- **Glass morphism**: `backdrop-blur-sm` pada modal & nav.

### 10.2 Key Pages
| Route | Page | Description |
| --- | --- | --- |
| `/` | Home | Hero + How it Works + Upcoming + Leaderboard |
| `/dashboard` | Role Selector | "Quiz Creator" vs "Join as Player" |
| `/create` | Quiz Builder | Form metadata → soal → reward → publish |
| `/play` | Player Join | Code/QR → avatar → wait → game → result |
| `/leaderboard` | Global Leaderboard | All-time top scorers |

### 10.3 Critical UX Flows
- **Onboarding (MiniPay user)**: Open URL → auto-connect → join quiz dalam <30 detik.
- **Onboarding (Desktop user)**: Open URL → klik Connect → pilih wallet → approve → masuk dashboard.
- **Quiz Live**: Soal tampil dengan timer besar di tengah, opsi A/B/C/D dengan warna berbeda.
- **Reward Claim**: Pasca quiz, top 3 lihat tombol "Claim X CELO" → wallet popup → confirm → toast success + explorer link.

### 10.4 Komponen Reusable
- `Navbar` — fixed top, logo + nav links + theme/lang toggle + wallet button
- `WalletDropdown` — show address, balance, disconnect
- `WalletModal` / `AuthModal` — connect flow
- `QuestionCard`, `OptionButton`, `Timer`, `LeaderboardRow`
- `ConfettiBurst` — winner celebration
- `Toast` — notifications

---

## 11. Smart Contract Specification

### 11.1 Contract: `QuizEscrow.sol`

#### Functions
```solidity
function createQuizAndDeposit(bytes32 _quizId, string calldata _roomCode) external payable;
function addToRewardPool(bytes32 _quizId) external payable;
function distributeRewards(bytes32 _quizId, address[] calldata _winners) external; // host only
function cancelQuiz(bytes32 _quizId) external; // host only
function getQuizInfo(bytes32 _quizId) external view returns (address host, uint256 rewardPool, bool isActive, bool isDistributed, string memory roomCode);
function getContractBalance() external view returns (uint256);
function updateRewardDistribution(uint256 _first, uint256 _second, uint256 _third) external; // owner
function transferOwnership(address _newOwner) external; // owner
```

#### Events
```solidity
event QuizCreated(bytes32 indexed quizId, address indexed host, string roomCode);
event RewardDeposited(bytes32 indexed quizId, address indexed host, uint256 amount);
event RewardDistributed(bytes32 indexed quizId, address indexed winner, uint256 amount, uint256 rank);
event QuizCancelled(bytes32 indexed quizId, address indexed host, uint256 refundAmount);
```

#### Distribusi Default
- Juara 1: 50%
- Juara 2: 30%
- Juara 3: 20%

#### Security Requirements
- ReentrancyGuard pada `distributeRewards`, `cancelQuiz`
- Ownable pada admin functions
- CHECKS-EFFECTS-INTERACTIONS pattern
- No `tx.origin` usage — gunakan `msg.sender`
- Bound array winners ≤ 3
- Validasi `quiz.isActive` && `!quiz.isDistributed` sebelum distribute

### 11.2 Deployment
- Network dev: **Celo Alfajores** (RPC: `https://alfajores-forno.celo-testnet.org`)
- Network prod: **Celo Mainnet** (RPC: `https://forno.celo.org`)
- Verify di Celoscan setelah deploy.

---

## 12. Integration & API

### 12.1 External Services
| Service | Purpose | Critical? |
| --- | --- | --- |
| Supabase | DB + Auth + Realtime | Yes |
| Celo RPC (Forno) | Blockchain read/write | Yes |
| Vercel | Hosting | Yes |
| Celoscan API | Tx verification (optional) | No |

### 12.2 Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_QUIZ_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_WC_PROJECT_ID=  # WalletConnect (optional)
SUPABASE_SERVICE_ROLE_KEY=  # server-only
```

---

## 13. Analytics & Metrics

### 13.1 KPI Utama
| Metric | Target Bulan 3 | Sumber |
| --- | --- | --- |
| Weekly Active Wallets (WAW) | 1.000 | Supabase + on-chain events |
| Quiz Created / minggu | 100 | Supabase |
| Average Players / Quiz | 8 | Supabase |
| Total CELO Distributed | 5.000 CELO | On-chain `RewardDistributed` events |
| Reward Claim Success Rate | >95% | claim_tx populated / top 3 |
| Avg Time-to-First-Quiz (new host) | <5 menit | Funnel |

### 13.2 Event Tracking (TODO — pakai PostHog / Plausible)
- `wallet_connected` (provider, chain)
- `quiz_created` (reward_amount, num_questions)
- `quiz_published_onchain` (tx_hash, gas_used)
- `player_joined` (room_code)
- `quiz_completed` (final_score, rank)
- `reward_claimed` (amount, tx_hash)

---

## 14. Roadmap

### Phase 0 — Foundation (DONE ✅)
- [x] Next.js 16 + Tailwind v4 setup
- [x] Wagmi multi-wallet (5 wallets + MiniPay)
- [x] Supabase schema (profiles, quizzes, questions, leaderboard)
- [x] `QuizEscrow.sol` contract draft
- [x] `useCeloQuiz` hook
- [x] Bilingual UI (ENG/IND)
- [x] Dark mode

### Phase 1 — MVP Polish (Sprint Saat Ini)
- [ ] Supabase RLS policies finalize
- [ ] Smart contract unit tests (Foundry / Hardhat) — coverage >90%
- [ ] Deploy `QuizEscrow.sol` ke Alfajores + verify
- [ ] End-to-end test flow: create → deposit → play → distribute
- [ ] Error toast unification
- [ ] Loading states untuk semua tx
- [ ] Mobile QR scanner integration

### Phase 2 — Production Ready
- [ ] External audit smart contract
- [ ] Deploy ke Celo Mainnet
- [ ] Rate limiting (Upstash / Vercel KV)
- [ ] PostHog analytics integration
- [ ] PWA manifest + service worker
- [ ] Sentry error monitoring

### Phase 3 — Growth
- [ ] cUSD / cEUR support (stablecoin reward)
- [ ] AI question generator (in-app, bukan eksternal)
- [ ] Template marketplace
- [ ] Team/DAO multi-host support
- [ ] Quiz history & user achievements
- [ ] Referral program

### Phase 4 — Expansion
- [ ] Native mobile app (React Native)
- [ ] Multi-chain (Optimism, Base)
- [ ] NFT badge untuk winners
- [ ] Sponsored quizzes (advertising)

---

## 15. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- |
| Smart contract bug → fund loss | Critical | Medium | Audit eksternal + bug bounty + reentrancy guard |
| Supabase outage | High | Low | Banner + degraded mode; long-term: self-host fallback |
| Front-running pada distribute | Medium | Low | Host-only function; gunakan commit-reveal jika butuh public |
| MiniPay API berubah | Medium | Medium | Feature detect, fallback ke generic injected |
| Gas spike di Celo | Low | Low | Display estimate sebelum tx |
| Spam quiz (low-quality) | Low | High | Rate limit + min stake (future) |
| User lose connection mid-game | Medium | High | Reconnect grace period 30s; persist session local |
| Cheating (multiple submit) | Medium | Medium | One submit per question per wallet (DB constraint) |
| Privacy regulation (GDPR) | Medium | Low | Email optional; minimal PII; deletion endpoint |

---

## 16. Open Questions & Decisions Needed

1. **Reward Token**: Hanya CELO, atau juga cUSD/cEUR di MVP? *(Rekomendasi: CELO only di MVP, stablecoin di Phase 3.)*
2. **Penalty untuk wrong answer**: Tidak ada penalty? Atau timer × -5? *(Rekomendasi: tidak ada penalty di MVP.)*
3. **Public quiz directory**: Apakah quiz publik bisa di-discover, atau harus pakai code? *(Rekomendasi: code-only di MVP, directory di Phase 3.)*
4. **Refund kalau peserta <3**: Apa yang terjadi kalau hanya 2 peserta finish? *(Rekomendasi: distribute proporsional ke peserta yang ada, sisa balik ke host.)*
5. **Quiz creation gating**: Free untuk semua, atau perlu hold token? *(Rekomendasi: free di MVP.)*

---

## 17. Glossary

| Term | Definition |
| --- | --- |
| **Host** | User yang membuat quiz & deposit reward |
| **Player** | User yang join & jawab quiz |
| **Room Code** | Code 6-digit untuk join quiz |
| **Reward Pool** | Total CELO yang dikunci di contract escrow |
| **Escrow** | Smart contract `QuizEscrow.sol` yang hold dana sampai distribute |
| **MiniPay** | Wallet ringan dalam Opera Mini di Afrika, EVM-compatible Celo |
| **Alfajores** | Testnet Celo |
| **Forno** | RPC endpoint resmi Celo |
| **bytes32 quizId** | UUID dari Supabase di-convert ke bytes32 untuk on-chain reference |

---

## 18. Appendix

### 18.1 Referensi Kode Kunci
- `src/lib/celo.ts` — Chain config, ABI, util
- `src/lib/wagmi.ts` — Wallet list & config
- `src/lib/supabase.ts` — DB client
- `src/hooks/useCeloQuiz.ts` — On-chain actions
- `src/components/CeloProvider.tsx` — Wagmi + MiniPay auto-connect
- `src/app/create/page.tsx` — Quiz builder
- `src/app/play/page.tsx` — Game flow
- `contracts/QuizEscrow.sol` — Escrow contract
- `supabase/schema.sql` — DB schema

### 18.2 Approval & Sign-off
| Role | Name | Date | Signature |
| --- | --- | --- | --- |
| Product Owner |  |  |  |
| Tech Lead |  |  |  |
| Smart Contract Dev |  |  |  |
| Designer |  |  |  |

---

*End of Document — v1.0 (2026-05-06)*

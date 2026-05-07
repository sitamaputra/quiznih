# Quiznih — Project Overview & File Flow

> Web3 trivia platform berbasis Celo blockchain. Host membuat kuis dan deposit hadiah CELO ke smart contract escrow. Pemain join, jawab pertanyaan, dan top-3 mendapat reward otomatis.

---

## Stack Utama

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16.2.1 (App Router) |
| React | 19.2.4 |
| Styling | Tailwind CSS v4 |
| Animasi | Framer Motion 12 |
| Blockchain | Celo (mainnet + Alfajores testnet) |
| Wallet | wagmi v3 + viem v2 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Font | Outfit (Google Fonts, via `--font-outfit`) |

---

## Struktur Folder

```
src/
├── app/                        # Next.js App Router — halaman & API
│   ├── layout.tsx              # Root layout (font, metadata, providers, background)
│   ├── globals.css             # CSS global + Tailwind base
│   ├── page.tsx                # Landing page (homepage)
│   ├── dashboard/page.tsx      # Pilih role: Creator vs Player
│   ├── create/
│   │   ├── page.tsx            # Form buat kuis baru
│   │   └── room/[id]/page.tsx  # Control room host (live session)
│   ├── play/page.tsx           # Halaman pemain (join + main kuis)
│   ├── manage/page.tsx         # Daftar semua kuis milik host
│   └── api/quiz/
│       ├── deposit/route.ts          # Catat deposit ke Supabase
│       ├── confirm-deposit/route.ts  # Verifikasi txHash on-chain
│       └── claim-reward/route.ts     # Catat klaim reward pemenang
│
├── components/                 # UI components
│   ├── Providers.tsx           # Root provider wrapper
│   ├── CeloProvider.tsx        # WagmiProvider + QueryClient + MiniPay auto-connect
│   ├── Navbar.tsx              # Navbar global (auth state, wallet, bahasa)
│   ├── AuthModal.tsx           # Modal login/register (Supabase + Web3 wallets)
│   ├── WalletDropdown.tsx      # Dropdown wallet terhubung (balance, copy, explorer)
│   ├── WalletModal.tsx         # Modal pilih wallet (standalone, dari WalletDropdown)
│   ├── HeroSection.tsx         # (legacy) komponen hero lama
│   ├── HowItWorks.tsx          # (legacy) section cara kerja lama
│   ├── Leaderboard.tsx         # (legacy) leaderboard lama
│   ├── UpcomingQuizzes.tsx     # (legacy) upcoming quizzes lama
│   ├── BlinkShare.tsx          # Blink/share widget
│   └── Footer.tsx              # Footer
│
├── context/
│   └── LanguageContext.tsx     # Context bahasa ENG ↔ ID (toggle global)
│
├── hooks/
│   └── useCeloQuiz.ts          # Hook utama semua interaksi smart contract
│
├── lib/
│   ├── celo.ts                 # Config chain, contract ABI, utility functions
│   ├── supabase.ts             # Supabase client singleton
│   └── wagmi.ts                # wagmi config + daftar wallet (WALLET_LIST)
│
└── types/
    └── database.ts             # TypeScript types untuk tabel Supabase
```

---

## Provider Tree (Urutan Wrapping)

```
RootLayout (layout.tsx)
└── Providers
    └── CeloProvider              ← WagmiProvider + QueryClientProvider + MiniPay auto-connect
        └── NextThemesProvider    ← dark/light mode
            └── LanguageProvider  ← ENG / ID toggle
                └── {children}   ← semua halaman
```

Artinya: **setiap komponen di seluruh app** bisa mengakses `useAccount()`, `useTheme()`, `useLanguage()`.

---

## Alur Halaman

### `/` — Landing Page (`page.tsx`)
Satu file besar dengan semua section inline:
- **Hero** — H1 "Decentralized Trivia.", CTA ke `/dashboard`, gambar 3D
- **How It Works** — 3 langkah: Connect → Quiz → Earn
- **MiniPay** — showcase integrasi MiniPay
- **Leaderboard** — live data dari tabel `leaderboard` Supabase
- **Upcoming Quizzes** — data dari tabel `quizzes`
- **Footer**

Navbar (`Navbar.tsx`) dirender di dalam `layout.tsx` dan muncul di semua halaman.

### `/dashboard` — Role Selector
- Jika belum connect wallet → prompt connect
- Pilih **Quiz Creator** → navigasi ke `/create`
- Pilih **Join as Player** → navigasi ke `/play`

### `/create` — Buat Kuis Baru
1. Host isi form: judul, deskripsi, pertanyaan (minimal 1), reward pool (CELO)
2. Submit → simpan ke tabel `quizzes` dan `questions` di Supabase
3. Jika reward pool > 0 → panggil `createQuizAndDeposit()` dari `useCeloQuiz` → transaksi on-chain ke `QuizEscrow` contract
4. Setelah berhasil → hit `POST /api/quiz/deposit` untuk catat txHash di DB
5. Redirect ke `/create/room/[id]`

### `/create/room/[id]` — Control Room Host
- Load data kuis dari Supabase, verifikasi `host_wallet === address`
- Tampilkan room code + QR code untuk dibagikan ke pemain
- Real-time listener via Supabase Realtime untuk daftar peserta
- Tombol **Start Quiz** → update status kuis ke `playing`, kirim pertanyaan satu per satu
- Setelah selesai → tampilkan leaderboard, bisa distribute rewards

### `/play` — Halaman Pemain
1. Pilih mode join: scan QR atau masukkan kode manual
2. Masukkan nama pemain
3. Join → masuk ke tabel `leaderboard` dengan score awal 0
4. Realtime listener Supabase untuk terima soal dari host
5. Jawab → skor dihitung berdasarkan kecepatan + kebenaran
6. Selesai → tampilkan hasil akhir + animasi confetti
7. Top-3 bisa klaim reward via `POST /api/quiz/claim-reward`

### `/manage` — Kelola Kuis Host
- Fetch semua kuis milik `address` dari Supabase
- Lihat status (waiting / playing / finished), reward pool, room code
- Bisa delete atau masuk ke control room

---

## Smart Contract Integration

Kontrak: **QuizEscrow** (address di env `NEXT_PUBLIC_QUIZ_ESCROW_ADDRESS`)  
Network: Celo Alfajores (testnet) — toggle via `IS_TESTNET` di `lib/celo.ts`

### Fungsi Kontrak
| Fungsi | Dipanggil dari | Keterangan |
|---|---|---|
| `createQuizAndDeposit(bytes32, string)` | `useCeloQuiz.ts` | Host deposit CELO saat buat kuis |
| `addToRewardPool(bytes32)` | `useCeloQuiz.ts` | Host tambah reward setelah kuis dibuat |
| `distributeRewards(bytes32, address[])` | Control room | Host distribute ke top-3 setelah kuis selesai |
| `cancelQuiz(bytes32)` | Control room | Host cancel → CELO dikembalikan |
| `getQuizInfo(bytes32)` | Read-only via `publicClient` | Cek status escrow |

### `useCeloQuiz.ts` — Hook Utama On-Chain
Mengekspos:
- `createQuizAndDeposit()`, `addToRewardPool()`, `distributeRewards()`, `cancelQuiz()`
- State: `isDepositing`, `isDistributing`, `isCancelling`
- Info: `balance`, `balanceSymbol`, `chainName`, `isTestnet`

---

## Database (Supabase)

### Tabel Utama

**`quizzes`**
```
id (UUID) | host_wallet | title | description | room_code
status: waiting | playing | finished
reward_pool_amount (CELO) | escrow_balance
deposit_status: none | pending | confirmed | deposit_tx (txHash)
contract_quiz_id (bytes32)
```

**`questions`**
```
id | quiz_id (FK) | question_text | options (JSONB array)
correct_answer_index | time_limit_seconds | order_number
```

**`leaderboard`**
```
id | quiz_id (FK) | user_wallet | player_name
final_score | claimed_reward (bool)
claim_tx | reward_amount (CELO)
```

**`profiles`** *(Web2 users)*
```
id | wallet_address | username | avatar_url | total_score
```

### API Routes (Server-side)

| Route | Method | Fungsi |
|---|---|---|
| `/api/quiz/deposit` | POST | Catat deposit ke tabel `quizzes` |
| `/api/quiz/confirm-deposit` | POST | Verifikasi txHash via viem `getTransactionReceipt` |
| `/api/quiz/claim-reward` | POST | Hitung rank, tandai `claimed_reward = true` |

Reward distribution formula: **Rank 1 → 50%, Rank 2 → 30%, Rank 3 → 20%** dari total pool.

---

## Autentikasi

Dua jalur auth yang bisa berjalan bersamaan:

### Web3 (Wallet)
- Via wagmi + `injected()` connector
- Mendukung: **MetaMask, Rabby, OKX, Bitget, Trust Wallet**
- MiniPay (Celo mini app) → auto-connect saat `window.ethereum.isMiniPay === true`
- Connector ID dimap di `AuthModal.tsx`: `connectorIdMap`

### Web2 (Supabase Auth)
- Email + password, atau Google OAuth
- State dikelola di `Navbar.tsx` via `supabase.auth.getSession()` + `onAuthStateChange()`
- Modal: `AuthModal.tsx` (bisa dibuka dari Navbar tombol "Sign In / Connect")

### Logika Navbar Auth
```
Tidak ada wallet DAN tidak ada user Supabase → tampil tombol "Sign In / Connect"
Ada user Supabase → tampil dropdown profil + ikon user
Ada wallet connect → tampil WalletDropdown (balance + copy + explorer)
```

---

## Wallet Support (`lib/wagmi.ts`)

```ts
WALLET_LIST = [metamask, rabby, okx, bitget, trust]
```
Setiap wallet punya `id`, `name`, `icon`, `color`, `rdns`.  
Connector dibuat dengan `injected({ target })` menggunakan provider dari `window`.

---

## Bahasa (`context/LanguageContext.tsx`)

Global state `lang: "ENG" | "ID"`.  
Toggle via `toggleLang()`, tersedia di semua komponen via `useLanguage()`.  
Semua teks UI menggunakan pattern: `lang === "ENG" ? "..." : "..."`.

---

## Brand Colors

| Token | Hex | Digunakan untuk |
|---|---|---|
| Celo Green | `#35D07F` | CTA utama, aksen, gradient kiri |
| Celo Yellow | `#FCFF52` | Aksen sekunder, gradient kanan, section titles |
| Dark text | `#0a1a0f` | Body text di light mode |
| Muted text | `#4a6357` | Subtext, placeholder |

---

## File Paling Kritis

| File | Kenapa penting |
|---|---|
| `src/lib/celo.ts` | Satu-satunya sumber konfigurasi blockchain, ABI kontrak, dan utilities |
| `src/lib/wagmi.ts` | Konfigurasi semua wallet connector |
| `src/hooks/useCeloQuiz.ts` | Semua write transaction on-chain lewat sini |
| `src/app/page.tsx` | Seluruh landing page ada di sini (inline, tidak pakai komponen lama) |
| `src/components/Navbar.tsx` | Mengelola state auth Web2 + trigger AuthModal |
| `src/components/AuthModal.tsx` | Entry point semua user (Web2 login + Web3 connect) |
| `src/types/database.ts` | Source of truth untuk shape data Supabase |

/**
 * Bot Script: Spin Wheel Circular Loop
 *
 * Flow:
 *  1. Backend buka session baru + deposit pool
 *  2. Generate N wallet baru
 *  3. Backend seed gas CELO ke tiap generated wallet
 *  4. Backend sign claim untuk tiap wallet
 *  5. Generated wallet call claimSpin() (bayar gas sendiri dari seed)
 *  6. Generated wallet kirim semua CELO (reward + sisa seed) balik ke backend
 *  7. Backend tutup session & ambil sisa pool → ulangi
 *
 * Jalankan: npx ts-node scripts/bot-spin.ts
 * Butuh: PRIVATE_KEY dan SPIN_WHEEL_PROXY_ADDRESS di .env
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  formatEther,
  keccak256,
  encodePacked,
  generatePrivateKey,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";
import * as dotenv from "dotenv";
import { SPIN_WHEEL_ABI } from "./abi";

dotenv.config();

// ─── Config ──────────────────────────────────────────────────────────────────

const CELO_SEPOLIA = defineChain({
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: { default: { http: ["https://celo-sepolia.drpc.org"] } },
});

const SPIN_WHEEL_ADDRESS = process.env.SPIN_WHEEL_PROXY_ADDRESS as Address;
const BACKEND_PRIVATE_KEY = (
  process.env.PRIVATE_KEY?.startsWith("0x")
    ? process.env.PRIVATE_KEY
    : `0x${process.env.PRIVATE_KEY}`
) as `0x${string}`;

const POOL_PER_SESSION = "0.5";    // CELO yang di-deposit per session
const SPINS_PER_SESSION = 5;       // berapa wallet per session
const GAS_SEED_PER_WALLET = "0.01"; // CELO seed ke tiap generated wallet (untuk gas claimSpin + send back)

// ─── Clients ─────────────────────────────────────────────────────────────────

const backendAccount = privateKeyToAccount(BACKEND_PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: CELO_SEPOLIA,
  transport: http(),
});

const backendClient = createWalletClient({
  account: backendAccount,
  chain: CELO_SEPOLIA,
  transport: http(),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uuidToBytes32(uuid: string): `0x${string}` {
  const cleaned = uuid.replace(/-/g, "");
  return `0x${cleaned.padEnd(64, "0")}` as `0x${string}`;
}

function randomUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function signClaim(
  sessionId: string,
  player: Address,
  amountWei: bigint
): Promise<`0x${string}`> {
  const chainId = BigInt(CELO_SEPOLIA.id);
  const sessionIdBytes32 = uuidToBytes32(sessionId);

  const msgHash = keccak256(
    encodePacked(
      ["uint256", "bytes32", "address", "uint256", "address"],
      [chainId, sessionIdBytes32, player, amountWei, SPIN_WHEEL_ADDRESS]
    )
  );

  return backendAccount.signMessage({ message: { raw: msgHash } });
}

async function getBalance(address: Address): Promise<bigint> {
  return publicClient.getBalance({ address });
}

async function waitTx(hash: `0x${string}`) {
  return publicClient.waitForTransactionReceipt({ hash });
}

// ─── Bot Logic ───────────────────────────────────────────────────────────────

/**
 * Satu iterasi loop:
 * 1. Backend buka session baru + deposit pool
 * 2. Generate N wallet, seed gas, sign claim, wallet call claimSpin()
 * 3. Tiap wallet kirim semua CELO balik ke backend
 * 4. Backend tutup session & ambil sisa pool
 */
async function runSession(wheelConfig: { label: string; celoAmount: number }[]) {
  const sessionId = randomUUID();
  const sessionIdBytes32 = uuidToBytes32(sessionId);
  const poolWei = parseEther(POOL_PER_SESSION);

  console.log(`\n─── Session: ${sessionId} ───`);
  console.log(`Pool: ${POOL_PER_SESSION} CELO`);

  const backendBalanceBefore = await getBalance(backendAccount.address);
  console.log(`Backend balance sebelum: ${formatEther(backendBalanceBefore)} CELO`);

  // ── 1. Buka session on-chain ──
  console.log("\n[1] Membuka session...");
  const createHash = await backendClient.writeContract({
    address: SPIN_WHEEL_ADDRESS,
    abi: SPIN_WHEEL_ABI,
    functionName: "createSession",
    args: [sessionIdBytes32],
    value: poolWei,
  });
  await waitTx(createHash);
  console.log(`    ✅ Session created. TX: ${createHash}`);

  // ── 2. Spin tiap wallet ──
  const slicesWithReward = wheelConfig.filter((s) => s.celoAmount > 0);
  let totalClaimed = 0n;

  for (let i = 0; i < SPINS_PER_SESSION; i++) {
    // Pilih slice random (simulasi spin)
    const slice = slicesWithReward[Math.floor(Math.random() * slicesWithReward.length)];
    const amountWei = BigInt(Math.round(slice.celoAmount * 1e18));

    // Generate wallet baru
    const pk = generatePrivateKey();
    const wallet = privateKeyToAccount(pk);
    const walletClient = createWalletClient({
      account: wallet,
      chain: CELO_SEPOLIA,
      transport: http(),
    });

    console.log(`\n[${i + 1}] Wallet: ${wallet.address}`);
    console.log(`     Slice: "${slice.label}" → ${slice.celoAmount} CELO`);

    // Seed gas ke generated wallet supaya bisa call claimSpin + send back
    console.log(`     Seeding gas: ${GAS_SEED_PER_WALLET} CELO...`);
    const seedHash = await backendClient.sendTransaction({
      to: wallet.address,
      value: parseEther(GAS_SEED_PER_WALLET),
    });
    await waitTx(seedHash);

    // Backend sign claim untuk wallet ini
    const sig = await signClaim(sessionId, wallet.address, amountWei);

    // Generated wallet call claimSpin() — bayar gas sendiri dari seed
    const claimHash = await walletClient.writeContract({
      address: SPIN_WHEEL_ADDRESS,
      abi: SPIN_WHEEL_ABI,
      functionName: "claimSpin",
      args: [sessionIdBytes32, amountWei, sig],
    });
    await waitTx(claimHash);
    console.log(`     ✅ Claimed. TX: ${claimHash}`);
    totalClaimed += amountWei;

    // Generated wallet kirim semua CELO balik ke backend
    // Sisakan sedikit untuk gas send back (estimasi konservatif)
    const walletBalance = await getBalance(wallet.address);
    const gasReserve = parseEther("0.002");
    const sendBack = walletBalance > gasReserve ? walletBalance - gasReserve : 0n;

    if (sendBack > 0n) {
      const returnHash = await walletClient.sendTransaction({
        to: backendAccount.address,
        value: sendBack,
      });
      await waitTx(returnHash);
      console.log(`     ✅ Returned ${formatEther(sendBack)} CELO to backend.`);
    }
  }

  // ── 3. Tutup session & ambil sisa pool ──
  console.log("\n[3] Menutup session...");
  const closeHash = await backendClient.writeContract({
    address: SPIN_WHEEL_ADDRESS,
    abi: SPIN_WHEEL_ABI,
    functionName: "closeSession",
    args: [sessionIdBytes32],
  });
  await waitTx(closeHash);
  console.log(`    ✅ Session closed. TX: ${closeHash}`);

  const backendBalanceAfter = await getBalance(backendAccount.address);
  const netChange = backendBalanceAfter - backendBalanceBefore;
  console.log(`\n─── Summary ───`);
  console.log(`Total claimed by bots: ${formatEther(totalClaimed)} CELO`);
  console.log(`Backend balance sesudah: ${formatEther(backendBalanceAfter)} CELO`);
  console.log(`Net change: ${formatEther(netChange)} CELO (gas cost)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!SPIN_WHEEL_ADDRESS) {
    console.error("Error: SPIN_WHEEL_PROXY_ADDRESS tidak ada di .env");
    process.exit(1);
  }

  // Wheel config — sesuaikan dengan session yang dibuat di UI
  const wheelConfig = [
    { label: "Jackpot",    celoAmount: 0.1 },
    { label: "Mini",       celoAmount: 0.05 },
    { label: "Micro",      celoAmount: 0.01 },
    { label: "Coba Lagi",  celoAmount: 0 }, // tidak ada reward
  ];

  const ROUNDS = 3;

  console.log("=== Quiznih Spin Bot ===");
  console.log(`Backend wallet: ${backendAccount.address}`);
  console.log(`Contract: ${SPIN_WHEEL_ADDRESS}`);

  for (let round = 1; round <= ROUNDS; round++) {
    console.log(`\n\n====== ROUND ${round}/${ROUNDS} ======`);
    await runSession(wheelConfig);

    if (round < ROUNDS) {
      console.log("\nNunggu 5 detik sebelum round berikutnya...");
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.log("\n✅ Bot selesai.");
}

main().catch(console.error);

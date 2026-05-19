/**
 * Spin Wheel Activity Bot — Quiznih Proof of Ship
 *
 * Cara pakai:
 *   1. Isi .env (lihat bagian CONFIG di bawah)
 *   2. npx ts-node scripts/spinbot.ts
 *
 * Yang dilakukan bot:
 *   - Generate N wallet baru
 *   - Fund masing-masing dari FUNDER_PRIVATE_KEY (untuk gas)
 *   - Request spin signature dari backend
 *   - Call claimSpin() di SpinWheel contract
 *   - Semua TX tercatat di Celo explorer & dihitung sebagai platform activity
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  formatEther,
  type Address,
  type WalletClient,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { celoAlfajores } from "viem/chains"; // ganti ke celo untuk mainnet

// ─── CONFIG ─────────────────────────────────────────────────────────────────

const CONFIG = {
  // Wallet yang punya CELO untuk biayain bot (gas + modal spin)
  FUNDER_PRIVATE_KEY: process.env.FUNDER_PRIVATE_KEY as `0x${string}`,

  // SpinWheel contract address (setelah deploy)
  CONTRACT_ADDRESS: process.env.SPIN_WHEEL_ADDRESS as Address,

  // Session ID (UUID dari Supabase) yang sudah di-create oleh host
  SESSION_ID: process.env.SPIN_SESSION_ID as string,

  // Backend API URL
  API_BASE: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Jumlah bot wallet yang di-generate
  BOT_COUNT: parseInt(process.env.BOT_COUNT || "10"),

  // CELO untuk gas per bot (0.001 CELO cukup untuk beberapa TX)
  GAS_FUND_PER_BOT: parseEther("0.001"),

  // Prize amount per spin dalam wei — harus match apa yang dikirim ke backend
  // Ini bisa diambil dari config spin session
  PRIZE_AMOUNT_WEI: process.env.PRIZE_AMOUNT_WEI || "100000000000000", // 0.0001 CELO default

  // Delay antar bot (ms) — supaya tidak terlihat terlalu bot-like
  DELAY_BETWEEN_BOTS_MS: parseInt(process.env.BOT_DELAY_MS || "3000"),

  // Chain config
  CHAIN: celoAlfajores,
};

// ─── ABI (hanya fungsi yang dipakai bot) ─────────────────────────────────────

const SPIN_WHEEL_ABI = [
  {
    type: "function",
    name: "claimSpin",
    inputs: [
      { name: "sessionId", type: "bytes32" },
      { name: "amount",    type: "uint256" },
      { name: "signature", type: "bytes"   },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "hasClaimed",
    inputs: [
      { name: "sessionId", type: "bytes32" },
      { name: "player",    type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uuidToBytes32(uuid: string): `0x${string}` {
  return `0x${uuid.replace(/-/g, "").padEnd(64, "0")}` as `0x${string}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// ─── Core ────────────────────────────────────────────────────────────────────

async function fundWallet(
  funderClient: WalletClient,
  publicClient: ReturnType<typeof createPublicClient>,
  toAddress: Address,
  amount: bigint
) {
  const hash = await funderClient.sendTransaction({
    to:    toAddress,
    value: amount,
    chain: CONFIG.CHAIN,
    account: funderClient.account!,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  log(`  Funded ${toAddress} with ${formatEther(amount)} CELO — tx: ${hash}`);
  return hash;
}

async function requestSpinSignature(
  sessionId: string,
  playerAddress: Address,
  prizeAmountWei: string
): Promise<{ signature: `0x${string}`; amountWei: string }> {
  const res = await fetch(`${CONFIG.API_BASE}/api/spin/request`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, playerAddress, prizeAmountWei }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Backend error: ${err.error}`);
  }

  return res.json();
}

async function claimSpin(
  botClient: WalletClient,
  publicClient: ReturnType<typeof createPublicClient>,
  sessionIdBytes32: `0x${string}`,
  amountWei: bigint,
  signature: `0x${string}`
): Promise<string> {
  const hash = await botClient.writeContract({
    address:      CONFIG.CONTRACT_ADDRESS,
    abi:          SPIN_WHEEL_ABI,
    functionName: "claimSpin",
    args:         [sessionIdBytes32, amountWei, signature],
    chain:        CONFIG.CHAIN,
    account:      botClient.account!,
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!CONFIG.FUNDER_PRIVATE_KEY || !CONFIG.CONTRACT_ADDRESS || !CONFIG.SESSION_ID) {
    console.error("ERROR: Set FUNDER_PRIVATE_KEY, SPIN_WHEEL_ADDRESS, SPIN_SESSION_ID di .env");
    process.exit(1);
  }

  const publicClient = createPublicClient({
    chain:     CONFIG.CHAIN,
    transport: http(),
  });

  const funderAccount = privateKeyToAccount(CONFIG.FUNDER_PRIVATE_KEY);
  const funderClient  = createWalletClient({
    account:   funderAccount,
    chain:     CONFIG.CHAIN,
    transport: http(),
  });

  const sessionIdBytes32 = uuidToBytes32(CONFIG.SESSION_ID);

  log(`Bot dimulai`);
  log(`Contract  : ${CONFIG.CONTRACT_ADDRESS}`);
  log(`Session   : ${CONFIG.SESSION_ID}`);
  log(`Bot count : ${CONFIG.BOT_COUNT}`);
  log(`Prize/bot : ${formatEther(BigInt(CONFIG.PRIZE_AMOUNT_WEI))} CELO`);
  log(`Funder    : ${funderAccount.address}`);
  log(`─`.repeat(60));

  const results: { address: Address; txHash?: string; error?: string }[] = [];

  for (let i = 0; i < CONFIG.BOT_COUNT; i++) {
    log(`\nBot #${i + 1} / ${CONFIG.BOT_COUNT}`);

    // 1. Generate wallet baru
    const privateKey = generatePrivateKey();
    const account    = privateKeyToAccount(privateKey);
    log(`  Wallet: ${account.address}`);

    try {
      // 2. Fund bot wallet untuk gas
      await fundWallet(funderClient, publicClient, account.address, CONFIG.GAS_FUND_PER_BOT);

      // 3. Request signature dari backend
      log(`  Requesting spin signature...`);
      const { signature, amountWei } = await requestSpinSignature(
        CONFIG.SESSION_ID,
        account.address,
        CONFIG.PRIZE_AMOUNT_WEI
      );
      log(`  Signature OK — amount: ${formatEther(BigInt(amountWei))} CELO`);

      // 4. Claim spin on-chain
      const botClient = createWalletClient({
        account,
        chain:     CONFIG.CHAIN,
        transport: http(),
      });

      log(`  Calling claimSpin()...`);
      const txHash = await claimSpin(
        botClient,
        publicClient,
        sessionIdBytes32,
        BigInt(amountWei),
        signature as `0x${string}`
      );

      log(`  ✓ Claimed! TX: ${txHash}`);
      log(`    Explorer: https://alfajores.celoscan.io/tx/${txHash}`);

      results.push({ address: account.address, txHash });
    } catch (err: any) {
      log(`  ✗ Error: ${err.message}`);
      results.push({ address: account.address, error: err.message });
    }

    // Delay antar bot
    if (i < CONFIG.BOT_COUNT - 1) {
      log(`  Waiting ${CONFIG.DELAY_BETWEEN_BOTS_MS}ms...`);
      await sleep(CONFIG.DELAY_BETWEEN_BOTS_MS);
    }
  }

  // ─── Summary ──────────────────────────────────────────────
  log(`\n${"═".repeat(60)}`);
  log(`SUMMARY`);
  log(`${"═".repeat(60)}`);

  const success = results.filter((r) => r.txHash);
  const failed  = results.filter((r) => r.error);

  log(`Berhasil : ${success.length} / ${CONFIG.BOT_COUNT}`);
  log(`Gagal    : ${failed.length} / ${CONFIG.BOT_COUNT}`);

  const totalClaimed = success.length * Number(formatEther(BigInt(CONFIG.PRIZE_AMOUNT_WEI)));
  log(`Total claimed : ${totalClaimed.toFixed(6)} CELO`);

  if (success.length > 0) {
    log(`\nTransaction hashes (tercatat di Celo explorer):`);
    success.forEach((r, i) => {
      log(`  #${i + 1}: https://alfajores.celoscan.io/tx/${r.txHash}`);
    });
  }

  if (failed.length > 0) {
    log(`\nFailed bots:`);
    failed.forEach((r) => log(`  ${r.address}: ${r.error}`));
  }
}

main().catch(console.error);

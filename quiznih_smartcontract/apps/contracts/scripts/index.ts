/**
 * Quiznih Spin Bot — Main Orchestrator
 *
 * Setup (pertama kali):
 *   1. npm install
 *   2. Buat file .env (lihat spinbot.env.example)
 *
 * Jalankan: npm run bot
 * Butuh: .env dengan PRIVATE_KEY, SPIN_WHEEL_PROXY_ADDRESS, IS_MAINNET
 */

import { formatEther } from "viem";
import {
  backendAccount,
  ROUNDS,
  SPINS_PER_SESSION,
  POOL_PER_SESSION,
  WHEEL_CONFIG,
  IS_MAINNET,
  CHAIN,
} from "./config";
import { getBalance, randomUUID } from "./helpers";
import { createSession, closeSession } from "./session";
import { runSpin } from "./spin";

async function runRound(round: number): Promise<void> {
  const sessionId = randomUUID();
  const slicesWithReward = WHEEL_CONFIG.filter((s) => s.celoAmount > 0);

  console.log(`\n─── Session: ${sessionId} ───`);
  console.log(`Pool: ${POOL_PER_SESSION} CELO | Spins: ${SPINS_PER_SESSION}`);

  const balanceBefore = await getBalance(backendAccount.address);
  console.log(`Backend balance: ${formatEther(balanceBefore)} CELO`);

  // 1. Buka session
  console.log("\n[1] Membuka session...");
  await createSession(sessionId);

  // 2. Spin tiap wallet
  console.log(`\n[2] Menjalankan ${SPINS_PER_SESSION} spin...`);
  let totalClaimed = 0n;

  for (let i = 1; i <= SPINS_PER_SESSION; i++) {
    const slice = slicesWithReward[Math.floor(Math.random() * slicesWithReward.length)];
    const claimed = await runSpin(sessionId, slice, i);
    totalClaimed += claimed;
  }

  // 3. Tutup session
  console.log("\n[3] Menutup session...");
  await closeSession(sessionId);

  const balanceAfter = await getBalance(backendAccount.address);
  const netChange = balanceAfter - balanceBefore;

  console.log(`\n─── Round ${round} Summary ───`);
  console.log(`Total claimed : ${formatEther(totalClaimed)} CELO`);
  console.log(`Balance sesudah: ${formatEther(balanceAfter)} CELO`);
  console.log(`Net (gas cost) : ${formatEther(netChange)} CELO`);
}

async function main(): Promise<void> {
  if (!process.env.SPIN_WHEEL_PROXY_ADDRESS) {
    console.error("Error: SPIN_WHEEL_PROXY_ADDRESS tidak ada di .env");
    process.exit(1);
  }

  console.log("=== Quiznih Spin Bot ===");
  console.log(`Network : ${IS_MAINNET ? "Celo Mainnet" : "Celo Sepolia"} (chain ${CHAIN.id})`);
  console.log(`Backend : ${backendAccount.address}`);
  console.log(`Rounds  : ${ROUNDS}`);

  for (let round = 1; round <= ROUNDS; round++) {
    console.log(`\n\n====== ROUND ${round}/${ROUNDS} ======`);
    await runRound(round);

    if (round < ROUNDS) {
      console.log("\nNunggu 5 detik...");
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.log("\n✅ Bot selesai.");
}

main().catch(console.error);

import {
  createWalletClient,
  http,
  parseEther,
  formatEther,
  type Address,
} from "viem";
import { appendFileSync } from "fs";
import { join } from "path";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import {
  backendClient,
  backendAccount,
  publicClient,
  SPIN_WHEEL_ADDRESS,
  CHAIN,
  GAS_SEED_PER_WALLET,
} from "./config";
import { getBalance, uuidToBytes32, waitTx } from "./helpers";
import { signClaim } from "./signer";
import { SPIN_WHEEL_ABI } from "./abi";

export interface SliceConfig {
  label: string;
  celoAmount: number;
}

/**
 * Satu siklus spin untuk 1 generated wallet:
 * 1. Generate wallet baru
 * 2. Backend seed gas ke wallet
 * 3. Backend sign claim
 * 4. Wallet call claimSpin() → dapat reward
 * 5. Wallet kirim semua CELO balik ke backend
 */
export async function runSpin(
  sessionId: string,
  slice: SliceConfig,
  index: number
): Promise<bigint> {
  const amountWei = BigInt(Math.round(slice.celoAmount * 1e18));
  const sessionIdBytes32 = uuidToBytes32(sessionId);

  // Generate wallet baru
  const pk = generatePrivateKey();
  const wallet = privateKeyToAccount(pk);

  // Simpan ke wallets.log (tidak di-commit)
  const logPath = join(__dirname, "wallets.log");
  appendFileSync(logPath, `${new Date().toISOString()} | ${wallet.address} | ${pk}\n`);

  const walletClient = createWalletClient({
    account: wallet,
    chain: CHAIN,
    transport: http(),
  });

  console.log(`\n  [${index}] Wallet : ${wallet.address}`);
  console.log(`       Slice  : "${slice.label}" → ${slice.celoAmount} CELO`);

  // 1. Seed gas ke wallet
  const backendNonce = await publicClient.getTransactionCount({
    address: backendAccount.address,
    blockTag: "pending",
  });
  const seedHash = await backendClient.sendTransaction({
    to: wallet.address,
    value: parseEther(GAS_SEED_PER_WALLET),
    nonce: backendNonce,
  });
  await waitTx(seedHash);
  console.log(`       ✅ Gas seeded: ${GAS_SEED_PER_WALLET} CELO`);

  // 2. Sign + claim
  const sig = await signClaim(sessionId, wallet.address, amountWei);

  const claimHash = await walletClient.writeContract({
    address: SPIN_WHEEL_ADDRESS,
    abi: SPIN_WHEEL_ABI,
    functionName: "claimSpin",
    args: [sessionIdBytes32, amountWei, sig],
    gas: 200000n,
  });
  await waitTx(claimHash);
  console.log(`       ✅ Claimed ${slice.celoAmount} CELO. TX: ${claimHash}`);

  // 3. Kirim semua CELO balik ke backend
  // Kirim 90% dari sisa balance — sisakan 10% untuk gas
  const balance = await getBalance(wallet.address);
  const sendBack = balance * 80n / 100n;

  if (sendBack > 0n) {
    const nonce = await publicClient.getTransactionCount({ address: wallet.address, blockTag: "pending" });
    const returnHash = await walletClient.sendTransaction({
      to: backendAccount.address,
      value: sendBack,
      nonce,
    });
    await waitTx(returnHash);
    console.log(`       ✅ Returned ${formatEther(sendBack)} CELO to backend`);
  }

  return amountWei;
}

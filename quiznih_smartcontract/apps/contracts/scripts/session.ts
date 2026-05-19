import { parseEther } from "viem";
import { backendClient, SPIN_WHEEL_ADDRESS, POOL_PER_SESSION } from "./config";
import { uuidToBytes32, waitTx } from "./helpers";
import { SPIN_WHEEL_ABI } from "./abi";

/**
 * Buka session baru dan deposit prize pool ke contract.
 * Returns bytes32 sessionId yang dipakai on-chain.
 */
export async function createSession(sessionId: string): Promise<void> {
  const sessionIdBytes32 = uuidToBytes32(sessionId);
  const poolWei = parseEther(POOL_PER_SESSION);

  const hash = await backendClient.writeContract({
    address: SPIN_WHEEL_ADDRESS,
    abi: SPIN_WHEEL_ABI,
    functionName: "createSession",
    args: [sessionIdBytes32],
    value: poolWei,
  });

  await waitTx(hash);
  console.log(`  ✅ Session created. TX: ${hash}`);
}

/**
 * Tutup session dan ambil sisa pool balik ke backend.
 */
export async function closeSession(sessionId: string): Promise<void> {
  const sessionIdBytes32 = uuidToBytes32(sessionId);

  const hash = await backendClient.writeContract({
    address: SPIN_WHEEL_ADDRESS,
    abi: SPIN_WHEEL_ABI,
    functionName: "closeSession",
    args: [sessionIdBytes32],
  });

  await waitTx(hash);
  console.log(`  ✅ Session closed. TX: ${hash}`);
}

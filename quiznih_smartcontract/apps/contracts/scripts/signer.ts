import { keccak256, encodePacked, type Address } from "viem";
import { backendAccount, CHAIN, SPIN_WHEEL_ADDRESS } from "./config";
import { uuidToBytes32 } from "./helpers";

/**
 * Backend sign claim untuk satu wallet.
 * Signature: keccak256(chainId, sessionId, player, amount, contractAddress)
 */
export async function signClaim(
  sessionId: string,
  player: Address,
  amountWei: bigint
): Promise<`0x${string}`> {
  const chainId = BigInt(CHAIN.id);
  const sessionIdBytes32 = uuidToBytes32(sessionId);

  const msgHash = keccak256(
    encodePacked(
      ["uint256", "bytes32", "address", "uint256", "address"],
      [chainId, sessionIdBytes32, player, amountWei, SPIN_WHEEL_ADDRESS]
    )
  );

  return backendAccount.signMessage({ message: { raw: msgHash } });
}

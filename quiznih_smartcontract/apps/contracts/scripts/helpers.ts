import { type Address } from "viem";
import { publicClient } from "./config";

export function uuidToBytes32(uuid: string): `0x${string}` {
  const cleaned = uuid.replace(/-/g, "");
  return `0x${cleaned.padEnd(64, "0")}` as `0x${string}`;
}

export function randomUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function getBalance(address: Address): Promise<bigint> {
  return publicClient.getBalance({ address });
}

export async function waitTx(hash: `0x${string}`) {
  return publicClient.waitForTransactionReceipt({ hash });
}

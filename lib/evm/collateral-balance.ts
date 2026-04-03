import { formatUnits, type Address } from "viem";

import { readFaucetChainCollateralBalance } from "@/lib/evm/read-faucet-collateral-balance";

/** Solde USDC / collatéral sur la chaîne faucet (même jeton que le trade). */
export async function readCollateralBalance(wallet: Address) {
  const pos = await readFaucetChainCollateralBalance(wallet);
  if (!pos) return null;
  const decimals = pos.decimals ?? 6;
  let balanceRaw: bigint;
  try {
    balanceRaw = BigInt(pos.balanceRaw);
  } catch {
    return null;
  }
  return {
    balanceRaw,
    decimals,
    formatted: formatUnits(balanceRaw, decimals),
  };
}

import { getAddress, type Address } from "viem";

/** USDC natif Ethereum mainnet (Circle). */
export const MAINNET_USDC_ADDRESS =
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const;

export function getMainnetUsdcAddress(): Address {
  const raw = process.env.UNISWAP_MAINNET_USDC_ADDRESS?.trim();
  if (raw?.startsWith("0x")) {
    return getAddress(raw as Address);
  }
  return getAddress(MAINNET_USDC_ADDRESS);
}

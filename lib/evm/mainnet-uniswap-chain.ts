import { defineChain } from "viem";

/** RPC Ethereum mainnet — utilisé uniquement pour signer / diffuser les swaps Uniswap (pas le testnet Gains). */
export function isUniswapMainnetRpcConfigured(): boolean {
  const url = process.env.MAINNET_RPC_URL?.trim();
  return Boolean(url);
}

export function getUniswapMainnetChain() {
  const url = process.env.MAINNET_RPC_URL?.trim();
  if (!url) {
    throw new Error("MAINNET_RPC_URL is not set (required for Uniswap on Ethereum mainnet).");
  }
  return defineChain({
    id: 1,
    name: "Ethereum",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [url] } },
  });
}

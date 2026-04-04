import { defineChain, type Chain } from "viem";

import { getFaucetChain, isFaucetChainConfigured } from "@/lib/evm/faucet-chain";
import {
  getGainsExecRuntime,
  isGainsExecSurfaceConfigured,
} from "@/lib/gns/gains-exec-context";
import { extractNumericChainId } from "@/lib/mobula/duel-mainnet-chains";

export type ResolveWithdrawChainResult =
  | { ok: true; chain: Chain }
  | { ok: false; error: string };

/**
 * Associe le `chainId` affiché par le portfolio (Mobula) à une chaîne viem + RPC serveur.
 */
export function resolveChainForWithdraw(chainIdRaw: string): ResolveWithdrawChainResult {
  const numeric = extractNumericChainId(chainIdRaw);
  if (numeric == null) {
    return { ok: false, error: "Identifiant de chaîne invalide." };
  }
  const id = Number(numeric);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Identifiant de chaîne invalide." };
  }

  if (isFaucetChainConfigured()) {
    const fid = Number(process.env.FAUCET_CHAIN_ID);
    if (id === fid) {
      return { ok: true, chain: getFaucetChain() };
    }
  }

  if (isGainsExecSurfaceConfigured("arbitrum")) {
    const { chain } = getGainsExecRuntime("arbitrum");
    if (id === chain.id) {
      return { ok: true, chain };
    }
  }

  const baseRpc = process.env.BASE_RPC_URL?.trim();
  if (baseRpc) {
    const baseId = Number(process.env.BASE_CHAIN_ID || 8453);
    if (id === baseId) {
      return {
        ok: true,
        chain: defineChain({
          id: baseId,
          name: "Base",
          nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
          rpcUrls: { default: { http: [baseRpc] } },
        }),
      };
    }
  }

  const ethRpc = process.env.ETHEREUM_RPC_URL?.trim();
  if (ethRpc && id === 1) {
    return {
      ok: true,
      chain: defineChain({
        id: 1,
        name: "Ethereum",
        nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
        rpcUrls: { default: { http: [ethRpc] } },
      }),
    };
  }

  return {
    ok: false,
    error: `Aucun RPC serveur pour la chaîne ${numeric}. Configure FAUCET_* (testnet), ARBITRUM_RPC_URL, BASE_RPC_URL ou ETHEREUM_RPC_URL.`,
  };
}

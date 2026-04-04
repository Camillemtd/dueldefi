import { type NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  encodeFunctionData,
  getAddress,
  http,
  parseUnits,
  type Address,
} from "viem";

import { erc20Abi } from "@/constants/erc20";
import { getSessionFromRequest } from "@/lib/auth/session";
import { authenticatedEvmClient } from "@/lib/dynamic/evm-client";
import { dynamicSignAndSendTransaction } from "@/lib/evm/dynamic-sign-send";
import { resolveChainForWithdraw } from "@/lib/evm/withdraw-chain";
import { findUserById } from "@/lib/db/users";

export const runtime = "nodejs";

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const user = await findUserById(session.userId);
  if (!user || user.pseudo !== session.pseudo) {
    return NextResponse.json({ error: "Session invalide." }, { status: 401 });
  }

  if (!user.wallet_address) {
    return NextResponse.json(
      { error: "Aucun wallet sur ce compte." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const chainIdRaw = typeof o.chainId === "string" ? o.chainId.trim() : "";
  const tokenIn = typeof o.tokenAddress === "string" ? o.tokenAddress.trim() : "";
  const recipientIn = typeof o.recipient === "string" ? o.recipient.trim() : "";
  const amountStr = typeof o.amount === "string" ? o.amount.trim() : "";
  const amountMax = o.amountMax === true;

  if (!chainIdRaw || !tokenIn || !recipientIn) {
    return NextResponse.json(
      { error: "chainId, tokenAddress et recipient sont requis." },
      { status: 400 },
    );
  }

  if (!amountMax && !amountStr) {
    return NextResponse.json(
      { error: "Indique un montant ou amountMax: true." },
      { status: 400 },
    );
  }

  let walletAddress: Address;
  let token: Address;
  let recipient: Address;
  try {
    walletAddress = getAddress(user.wallet_address as `0x${string}`);
    token = getAddress(tokenIn as `0x${string}`);
    recipient = getAddress(recipientIn as `0x${string}`);
  } catch {
    return NextResponse.json(
      { error: "Adresse wallet, token ou destinataire invalide." },
      { status: 400 },
    );
  }

  if (token === ZERO) {
    return NextResponse.json(
      { error: "Retrait de l’ETH natif non pris en charge ici — utilise un jeton ERC-20." },
      { status: 400 },
    );
  }

  const resolved = resolveChainForWithdraw(chainIdRaw);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }
  const { chain } = resolved;

  const authToken = process.env.DYNAMIC_AUTH_TOKEN;
  const environmentId = process.env.DYNAMIC_ENVIRONMENT_ID;
  if (!authToken || !environmentId) {
    return NextResponse.json(
      { error: "Configuration Dynamic manquante côté serveur." },
      { status: 500 },
    );
  }

  const transport = http(chain.rpcUrls.default.http[0]);
  const publicClient = createPublicClient({ chain, transport });

  let decimals: number;
  try {
    decimals = await publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "decimals",
    });
  } catch {
    return NextResponse.json(
      { error: "Impossible de lire les décimales du token (contrat invalide sur cette chaîne ?)." },
      { status: 400 },
    );
  }

  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
    return NextResponse.json({ error: "Décimales du token incohérentes." }, { status: 400 });
  }

  let balance: bigint;
  try {
    balance = await publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [walletAddress],
    });
  } catch {
    return NextResponse.json(
      { error: "Impossible de lire le solde du token." },
      { status: 502 },
    );
  }

  let amountWei: bigint;
  if (amountMax) {
    amountWei = balance;
  } else {
    try {
      amountWei = parseUnits(amountStr, decimals);
    } catch {
      return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
    }
  }

  if (amountWei <= BigInt(0)) {
    return NextResponse.json({ error: "Le montant doit être strictement positif." }, { status: 400 });
  }

  if (amountWei > balance) {
    return NextResponse.json(
      { error: "Solde insuffisant pour ce montant.", balanceRaw: balance.toString() },
      { status: 400 },
    );
  }

  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [recipient, amountWei],
  });

  try {
    const evmClient = await authenticatedEvmClient({ authToken, environmentId });
    const txHash = await dynamicSignAndSendTransaction({
      evmClient,
      walletAddress,
      to: token,
      data,
      chain,
    });
    return NextResponse.json({
      ok: true as const,
      txHash,
      chainId: chain.id,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Échec de l’envoi.";
    console.error("[wallet/withdraw]", e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

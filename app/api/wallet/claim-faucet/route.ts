import { NextRequest, NextResponse } from "next/server";
import { getAddress } from "viem";

import { getSessionFromRequest } from "@/lib/auth/session";
import { authenticatedEvmClient } from "@/lib/dynamic/evm-client";
import { findUserById } from "@/lib/db/users";
import { claimTestUsdcForWallet } from "@/lib/evm/claim-test-usdc";
import { isGetFreeDaiConfigured } from "@/lib/evm/get-free-dai";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (!isGetFreeDaiConfigured()) {
    return NextResponse.json(
      {
        error:
          "Faucet not configured on the server (USDC_FAUCET_CONTRACT_ADDRESS, FAUCET_RPC_URL, FAUCET_CHAIN_ID).",
      },
      { status: 503 },
    );
  }

  const user = await findUserById(session.userId);
  if (!user || user.pseudo !== session.pseudo) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  if (!user.wallet_address) {
    return NextResponse.json({ error: "No wallet on this account." }, { status: 400 });
  }

  let walletAddress: `0x${string}`;
  try {
    walletAddress = getAddress(user.wallet_address.trim() as `0x${string}`);
  } catch {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 500 });
  }

  const authToken = process.env.DYNAMIC_AUTH_TOKEN;
  const environmentId = process.env.DYNAMIC_ENVIRONMENT_ID;
  if (!authToken || !environmentId) {
    return NextResponse.json({ error: "Dynamic configuration missing." }, { status: 500 });
  }

  try {
    const evmClient = await authenticatedEvmClient({ authToken, environmentId });
    const { gasFundTxHash, faucetTxHash } = await claimTestUsdcForWallet({
      evmClient,
      walletAddress,
    });

    return NextResponse.json({
      ok: true,
      faucetTxHash,
      ...(gasFundTxHash ? { gasFundTxHash } : {}),
    });
  } catch (e) {
    console.error("[claim-faucet]", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Faucet failed (native gas or RPC).",
      },
      { status: 502 },
    );
  }
}

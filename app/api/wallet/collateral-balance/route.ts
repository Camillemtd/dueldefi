import { type NextRequest, NextResponse } from "next/server";
import { getAddress } from "viem";

import { getSessionFromRequest } from "@/lib/auth/session";
import { readCollateralBalance } from "@/lib/evm/collateral-balance";
import { findUserById } from "@/lib/db/users";

export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
  const session = await getSessionFromRequest(_request);
  if (!session) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const user = await findUserById(session.userId);
  if (!user || user.pseudo !== session.pseudo) {
    return NextResponse.json({ error: "Session invalide." }, { status: 401 });
  }

  if (!user.wallet_address) {
    return NextResponse.json({
      configured: false,
      error: "Aucun wallet associé au compte.",
    });
  }

  let wallet: `0x${string}`;
  try {
    wallet = getAddress(user.wallet_address.trim() as `0x${string}`);
  } catch {
    return NextResponse.json({ error: "Adresse wallet invalide." }, { status: 500 });
  }

  const bal = await readCollateralBalance(wallet);
  if (!bal) {
    return NextResponse.json({
      configured: false,
      error:
        "Lecture du solde impossible (FAUCET_RPC_URL, GNS_COLLATERAL_TOKEN_ADDRESS, etc.).",
    });
  }

  return NextResponse.json({
    configured: true,
    balanceRaw: bal.balanceRaw.toString(),
    decimals: bal.decimals,
    formatted: bal.formatted,
  });
}

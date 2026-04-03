import { type NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth/session";
import { findDuelWithPseudos } from "@/lib/db/duels";
import { findUserById } from "@/lib/db/users";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Identifiant de duel invalide." }, { status: 400 });
  }

  const duel = await findDuelWithPseudos(id);
  if (!duel) {
    return NextResponse.json({ error: "Duel introuvable." }, { status: 404 });
  }

  let viewer: { isCreator: boolean; isOpponent: boolean } | null = null;
  const session = await getSessionFromRequest(request);
  if (session) {
    const user = await findUserById(session.userId);
    if (user && user.pseudo === session.pseudo) {
      viewer = {
        isCreator: user.id === duel.creator_id,
        isOpponent:
          duel.opponent_id !== null && user.id === duel.opponent_id,
      };
    }
  }

  return NextResponse.json({
    id: duel.id,
    creatorPseudo: duel.creator_pseudo,
    opponentPseudo: duel.opponent_pseudo,
    stakeUsdc: duel.stake_usdc,
    durationSeconds: duel.duration_seconds,
    createdAt: duel.created_at.toISOString(),
    duelFull: duel.opponent_id !== null,
    viewer,
  });
}

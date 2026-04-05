import type { GainsDuelPnlOutcome } from "@/types/duel-pnl-outcome"

function parseUsdcColumn(raw: string | null): number | null {
  if (raw == null || String(raw).trim() === "") return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function inferWinnerFromScores(
  myPnlPct: number | null,
  opponentPnlPct: number | null,
  myPnlUsdc: number | null,
  opponentPnlUsdc: number | null,
): GainsDuelPnlOutcome["winner"] {
  if (
    myPnlPct != null &&
    opponentPnlPct != null &&
    Number.isFinite(myPnlPct) &&
    Number.isFinite(opponentPnlPct)
  ) {
    if (Math.abs(myPnlPct - opponentPnlPct) < 1e-9) return "tie"
    return myPnlPct > opponentPnlPct ? "you" : "opponent"
  }
  if (
    myPnlUsdc != null &&
    opponentPnlUsdc != null &&
    Number.isFinite(myPnlUsdc) &&
    Number.isFinite(opponentPnlUsdc)
  ) {
    if (Math.abs(myPnlUsdc - opponentPnlUsdc) < 1e-9) return "tie"
    return myPnlUsdc > opponentPnlUsdc ? "you" : "opponent"
  }
  return "unknown"
}

/**
 * Reconstruit le résultat affichable après reload à partir des colonnes `duels`
 * (`duel_closed_at` + PnL / `duel_winner_side`), mappées côté viewer.
 */
export function buildPersistedPnlOutcomeFromDuelRow(
  duel: {
    duel_closed_at: Date | string | null
    creator_pnl_pct: number | null
    opponent_pnl_pct: number | null
    creator_pnl_usdc: string | null
    opponent_pnl_usdc: string | null
    duel_winner_side: string | null
  },
  viewer: { isCreator: boolean; isOpponent: boolean } | null,
): GainsDuelPnlOutcome | null {
  if (!viewer || (!viewer.isCreator && !viewer.isOpponent)) return null
  if (duel.duel_closed_at == null) return null

  const cPct =
    typeof duel.creator_pnl_pct === "number" && Number.isFinite(duel.creator_pnl_pct)
      ? duel.creator_pnl_pct
      : null
  const oPct =
    typeof duel.opponent_pnl_pct === "number" && Number.isFinite(duel.opponent_pnl_pct)
      ? duel.opponent_pnl_pct
      : null
  const cU = parseUsdcColumn(duel.creator_pnl_usdc)
  const oU = parseUsdcColumn(duel.opponent_pnl_usdc)

  const myPnlPct = viewer.isCreator ? cPct : oPct
  const opponentPnlPct = viewer.isCreator ? oPct : cPct
  const myPnlUsdc = viewer.isCreator ? cU : oU
  const opponentPnlUsdc = viewer.isCreator ? oU : cU

  const side = duel.duel_winner_side?.trim().toLowerCase() || null
  let winner: GainsDuelPnlOutcome["winner"] = "unknown"
  if (side === "tie") winner = "tie"
  else if (side === "creator")
    winner = viewer.isCreator ? "you" : "opponent"
  else if (side === "opponent")
    winner = viewer.isOpponent ? "you" : "opponent"

  if (winner === "unknown") {
    winner = inferWinnerFromScores(
      myPnlPct,
      opponentPnlPct,
      myPnlUsdc,
      opponentPnlUsdc,
    )
  }

  return {
    myPnlPct,
    opponentPnlPct,
    myPnlUsdc,
    opponentPnlUsdc,
    winner,
  }
}

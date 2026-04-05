/** Résultat PnL d’un duel du point de vue du joueur connecté (WS ou DB). */
export type GainsDuelPnlOutcome = {
  /** PnL % retenu pour toi (tick ~1 s ou dernier connu si fermeture anticipée). */
  myPnlPct: number | null
  opponentPnlPct: number | null
  myPnlUsdc: number | null
  opponentPnlUsdc: number | null
  /** Victoire du point de vue du wallet connecté. */
  winner: "you" | "opponent" | "tie" | "unknown"
}

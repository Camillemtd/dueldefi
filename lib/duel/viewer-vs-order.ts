/** Ordre d’affichage VS : le joueur connecté est toujours à gauche quand il est dans le match. */

export type DuelVsBannerSides = {
  left: string;
  right: string;
  leftTag: string;
  rightTag: string;
};

export function duelVsBannerForViewer(
  creatorPseudo: string,
  opponentPseudo: string | null,
  viewer: { isCreator: boolean; isOpponent: boolean } | null,
  waitingLabel = "En attente…",
): DuelVsBannerSides {
  const opp = opponentPseudo ?? null;

  if (!viewer || (!viewer.isCreator && !viewer.isOpponent)) {
    return {
      left: creatorPseudo,
      right: opp ?? waitingLabel,
      leftTag: "Creator",
      rightTag: "Opponent",
    };
  }

  if (viewer.isOpponent && opp) {
    return {
      left: opp,
      right: creatorPseudo,
      leftTag: "Toi",
      rightTag: "Adversaire",
    };
  }

  return {
    left: creatorPseudo,
    right: opp ?? waitingLabel,
    leftTag: "Toi",
    rightTag: "Adversaire",
  };
}

/** Chaînes supportées par l’API Duel DeFi (REST + WebSocket). */
export type GainsApiChain = "Testnet" | "Arbitrum" | "Base";

export type GainsTradingPair = {
  pairIndex: number;
  name: string;
  from: string;
  to: string;
  groupIndex: number;
  feeIndex: number;
  spreadP: number;
  price: number;
  price24hAgo: number;
  percentChange: number;
  logo: string;
};

/** Snapshot position — champs optionnels selon la version du serveur WebSocket. */
export type GainsPositionUpdate = {
  pairIndex: number;
  leverage: number;
  /** Ancien schéma */
  long?: boolean;
  /** Schéma Duel DeFi WS (alias de `long`) */
  isLong?: boolean;
  openPrice: number;
  pnl: number;
  liquidationPrice?: number;
  liqUsdDecimaled?: number;
  pair?: string;
  tradeType?: number;
  percentChange?: number;
  index?: number;
  currentPriceUsdDecimaled?: number;
  collateral?: number;
  chain?: GainsApiChain | string;
};

/** Point PnL horodaté (historique WebSocket pour graphiques). */
export type GainsPositionPnlTick = { t: number; pnl: number };

export function gainsPositionStreamKey(p: GainsPositionUpdate): string {
  return `${p.pairIndex}-${p.index ?? 0}-${p.tradeType ?? 0}`;
}

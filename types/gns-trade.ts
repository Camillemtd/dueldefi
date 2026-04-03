import type { Address } from "viem";

/** Gains `tradeType` enum value (market, etc.) — test uses `0`. */
export type TradeType = number;

export interface GnsTrade {
  user: Address;
  index: number;
  pairIndex: number;
  leverage: number;
  long: boolean;
  isOpen: boolean;
  collateralIndex: number;
  tradeType: TradeType;
  collateralAmount: bigint;
  openPrice: bigint;
  tp: bigint;
  sl: bigint;
  isCounterTrade: boolean;
  positionSizeToken: bigint;
  __placeholder: bigint;
}

/** Précision prix on-chain Gains (`openPrice` / `closeTradeMarket` `_expectedPrice`). */
export const GAINS_PRICE_PRECISION = BigInt(10) ** BigInt(10);

const UINT64_MAX = (BigInt(1) << BigInt(64)) - BigInt(1);

/**
 * Convertit un prix spot USD « décimal » (ex. WebSocket `currentPriceUsdDecimaled`) en `uint64` 1e10.
 */
export function usdDecimalToGainsPriceUint64(priceDecimal: number): bigint {
  if (!Number.isFinite(priceDecimal) || priceDecimal <= 0) {
    throw new Error("Invalid USD price (must be finite & > 0).");
  }
  const scaled = BigInt(Math.round(priceDecimal * 1e10));
  if (scaled <= BigInt(0)) {
    throw new Error("Price rounds to zero.");
  }
  if (scaled > UINT64_MAX) {
    throw new Error("Price exceeds uint64.");
  }
  return scaled;
}

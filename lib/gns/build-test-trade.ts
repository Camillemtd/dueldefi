import { getAddress, type Address } from "viem";

import type { GnsTrade } from "@/types/gns-trade";

/**
 * Hardcoded test trade (Arbitrum Sepolia Gains).
 * Scales `positionSizeToken` from your 500 USDC example to a smaller collateral.
 */
const EXAMPLE_OPEN_PRICE = BigInt("668209500000000");
const EXAMPLE_POSITION_500_USDC = BigInt("74826832004034672");
const EXAMPLE_COLLATERAL = BigInt("500000000");

/** 10 USDC (6 decimals) — small test size */
const TEST_COLLATERAL_AMOUNT = BigInt("10000000");

export function buildHardcodedTestTrade(userRaw: string): GnsTrade {
  const user = getAddress(userRaw as Address);

  const positionSizeToken =
    (EXAMPLE_POSITION_500_USDC * TEST_COLLATERAL_AMOUNT) /
    EXAMPLE_COLLATERAL;

  return {
    user,
    index: 0,
    pairIndex: 0,
    leverage: 10_000,
    long: true,
    isOpen: true,
    collateralIndex: 3,
    tradeType: 0,
    collateralAmount: TEST_COLLATERAL_AMOUNT,
    openPrice: EXAMPLE_OPEN_PRICE,
    tp: BigInt(0),
    sl: BigInt(0),
    isCounterTrade: false,
    positionSizeToken,
    __placeholder: BigInt(0),
  };
}

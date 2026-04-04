/** Montant fixe de démo : ETH → USDC (wei). Surcharge : UNISWAP_MAINNET_DEMO_ETH_WEI */
export function demoEthAmountWei(): string {
  const raw = process.env.UNISWAP_MAINNET_DEMO_ETH_WEI?.trim();
  if (raw && /^\d+$/.test(raw) && raw !== "0") {
    return raw;
  }
  return "1000000000000000"; // 0.001 ETH
}

/** Montant fixe de démo : USDC → ETH (plus petite unité, 6 décimales). Surcharge : UNISWAP_MAINNET_DEMO_USDC_RAW */
export function demoUsdcAmountRaw(): string {
  const raw = process.env.UNISWAP_MAINNET_DEMO_USDC_RAW?.trim();
  if (raw && /^\d+$/.test(raw) && raw !== "0") {
    return raw;
  }
  return "1000000"; // 1 USDC
}

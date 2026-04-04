"use client";

import { useCallback, useEffect, useState } from "react";

import {
  gameBtnGhost,
  gameBtnPrimary,
  gameLabel,
  gameMuted,
  gamePanel,
  gamePanelTopAccent,
} from "@/components/game-ui";

type DemoMeta = {
  ready: boolean;
  chainId: number;
  warnings: string[];
  demos: {
    eth_to_usdc: { label: string; amountWei: string };
    usdc_to_eth: { label: string; amountRaw: string };
  };
};

type SwapResult = {
  direction?: string;
  swapTxHash?: string;
  approvalTxHash?: string;
  cancelTxHash?: string;
  permitOnChainTxHash?: string;
  error?: string;
};

export function UniswapMainnetDemo() {
  const [meta, setMeta] = useState<DemoMeta | null>(null);
  const [metaErr, setMetaErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<"eth_usdc" | "usdc_eth" | null>(null);
  const [last, setLast] = useState<SwapResult | null>(null);

  const loadMeta = useCallback(async () => {
    setMetaErr(null);
    try {
      const res = await fetch("/api/trade/uniswap-mainnet-demo", {
        credentials: "include",
      });
      const data = (await res.json()) as DemoMeta & { error?: string };
      if (!res.ok) {
        setMeta(null);
        setMetaErr(data.error ?? "Could not load demo config.");
        return;
      }
      setMeta(data);
    } catch {
      setMeta(null);
      setMetaErr("Network error.");
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  async function run(direction: "eth_to_usdc" | "usdc_to_eth") {
    setLast(null);
    setBusy(direction === "eth_to_usdc" ? "eth_usdc" : "usdc_eth");
    try {
      const res = await fetch("/api/trade/uniswap-mainnet-demo", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      const data = (await res.json()) as SwapResult;
      if (!res.ok) {
        setLast({ error: data.error ?? `Error ${res.status}` });
        return;
      }
      setLast(data);
    } catch {
      setLast({ error: "Network error." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={`${gamePanel} ${gamePanelTopAccent} overflow-hidden`}>
      <div className="border-b border-[var(--game-cyan-dim)] px-6 py-5 sm:px-8">
        <p className={gameLabel}>Uniswap · Ethereum mainnet</p>
        <p className={`${gameMuted} mt-2 text-xs`}>
          Technical demo only: real swaps, fees in ETH. Requires{" "}
          <code className="text-[var(--game-cyan)]">MAINNET_RPC_URL</code>,{" "}
          <code className="text-[var(--game-cyan)]">UNISWAP_TRADE_API_KEY</code>, and mainnet
          balances on your Dynamic wallet.
        </p>
      </div>

      <div className="space-y-4 p-6 sm:p-8">
        <button
          type="button"
          onClick={() => void loadMeta()}
          className={`${gameBtnGhost} !w-auto`}
        >
          Refresh status
        </button>

        {metaErr ? (
          <p className="rounded-sm border border-[var(--game-danger)]/50 bg-[rgba(255,68,102,0.12)] px-3 py-2 text-sm text-[var(--game-danger)]">
            {metaErr}
          </p>
        ) : null}

        {meta?.warnings?.length ? (
          <ul className={`${gameMuted} list-inside list-disc text-xs`}>
            {meta.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : null}

        {meta ? (
          <p className="font-[family-name:var(--font-share-tech)] text-sm text-[var(--game-text)]">
            Chain <span className="text-[var(--game-cyan)]">{meta.chainId}</span> —{" "}
            {meta.ready ? (
              <span className="text-[var(--game-cyan)]">ready</span>
            ) : (
              <span className="text-[var(--game-danger)]">incomplete configuration</span>
            )}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={!meta?.ready || busy !== null}
            onClick={() => void run("eth_to_usdc")}
            className={`${gameBtnPrimary} flex-1`}
          >
            {busy === "eth_usdc" ? "Swap…" : meta ? meta.demos.eth_to_usdc.label : "ETH → USDC"}
          </button>
          <button
            type="button"
            disabled={!meta?.ready || busy !== null}
            onClick={() => void run("usdc_to_eth")}
            className={`${gameBtnPrimary} flex-1`}
          >
            {busy === "usdc_eth" ? "Swap…" : meta ? meta.demos.usdc_to_eth.label : "USDC → ETH"}
          </button>
        </div>

        {last?.error ? (
          <p className="rounded-sm border border-[var(--game-danger)]/50 bg-[rgba(255,68,102,0.12)] px-3 py-2 text-sm text-[var(--game-danger)]">
            {last.error}
          </p>
        ) : null}

        {last?.swapTxHash ? (
          <p className="break-all font-[family-name:var(--font-share-tech)] text-xs text-[var(--game-cyan)]">
            Swap tx: {last.swapTxHash}
            {last.approvalTxHash ? (
              <>
                <br />
                Approval: {last.approvalTxHash}
              </>
            ) : null}
            {last.cancelTxHash ? (
              <>
                <br />
                Cancel allowance : {last.cancelTxHash}
              </>
            ) : null}
            {last.permitOnChainTxHash ? (
              <>
                <br />
                Permit (on-chain) : {last.permitOnChainTxHash}
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}

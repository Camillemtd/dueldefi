"use client";

import { type FormEvent, useState } from "react";

export function OpenTestTradeForm() {
  const [pseudo, setPseudo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [approveTxHash, setApproveTxHash] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setTxHash(null);
    setApproveTxHash(null);
    setLoading(true);
    try {
      const res = await fetch("/api/trade/open-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo, password }),
      });
      const data = (await res.json()) as {
        error?: string;
        txHash?: string;
        approveTxHash?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Request failed.");
        return;
      }
      if (data.approveTxHash) setApproveTxHash(data.approveTxHash);
      if (data.txHash) setTxHash(data.txHash);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-[color-mix(in_oklab,var(--foreground)12%,transparent)] bg-[color-mix(in_oklab,var(--foreground)4%,transparent)] p-8">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Gains — test openTrade</h2>
        <p className="text-sm text-[color-mix(in_oklab,var(--foreground)65%,transparent)]">
          Hardcoded small LONG on pair 0 (10 USDC collat, leverage 10000). Same chain as{" "}
          <code className="text-xs">FAUCET_CHAIN_ID</code>.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          name="pseudo"
          placeholder="Username"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          className="w-full rounded-xl border border-[color-mix(in_oklab,var(--foreground)15%,transparent)] bg-background px-3 py-2 text-sm"
          autoComplete="username"
        />
        <input
          name="password"
          type="password"
          placeholder="Password (Dynamic wallet)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-[color-mix(in_oklab,var(--foreground)15%,transparent)] bg-background px-3 py-2 text-sm"
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-foreground py-2.5 text-sm font-medium text-background disabled:opacity-50"
        >
          {loading ? "Sending…" : "Open test trade"}
        </button>
      </form>
      {error ? (
        <p className="rounded-lg bg-red-500/12 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
      {approveTxHash ? (
        <p className="break-all font-mono text-xs text-[color-mix(in_oklab,var(--foreground)72%,transparent)]">
          Approve tx: {approveTxHash}
        </p>
      ) : null}
      {txHash ? (
        <p className="break-all font-mono text-xs text-[color-mix(in_oklab,var(--foreground)72%,transparent)]">
          openTrade tx: {txHash}
        </p>
      ) : null}
    </div>
  );
}

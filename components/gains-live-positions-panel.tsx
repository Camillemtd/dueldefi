"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import {
  duelLiveSoberShell,
  gameBtnDanger,
  gameLabel,
  gameMuted,
  gamePanel,
  gamePanelTopAccent,
} from "@/components/game-ui";
import {
  gainsPositionStreamKey,
  type GainsApiChain,
  type GainsPositionPnlTick,
  type GainsPositionUpdate,
} from "@/types/gains-api";

function isLong(p: GainsPositionUpdate): boolean {
  if (typeof p.long === "boolean") return p.long;
  if (typeof p.isLong === "boolean") return p.isLong;
  return false;
}

function liqPrice(p: GainsPositionUpdate): number | null {
  if (typeof p.liquidationPrice === "number" && Number.isFinite(p.liquidationPrice)) {
    return p.liquidationPrice;
  }
  if (typeof p.liqUsdDecimaled === "number" && Number.isFinite(p.liqUsdDecimaled)) {
    return p.liqUsdDecimaled;
  }
  return null;
}

function fmtUsd(n: number, maxFrac = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFrac,
  }).format(n);
}

function fmtSignedPct(n: number): string {
  const s = n >= 0 ? "+" : "";
  return `${s}${n.toFixed(2)}%`;
}

type SparklineProps = {
  points: GainsPositionPnlTick[];
  positive: boolean;
  gradientId: string;
  compact?: boolean;
  /** Étire le SVG sur la hauteur du parent (duel live plein écran). */
  fillHeight?: boolean;
  /** Vert / rouge sobre au lieu du cyan / magenta. */
  sober?: boolean;
};

function PnlSparkline({
  points,
  positive,
  gradientId,
  compact = false,
  fillHeight = false,
  sober = false,
}: SparklineProps) {
  const W = 100;
  const H = compact ? 24 : 36;
  const padX = 1;
  const padY = compact ? 2 : 3;

  const { lineD, areaD } = useMemo(() => {
    if (points.length < 2) {
      return { lineD: "", areaD: "" };
    }
    const pnls = points.map((p) => p.pnl);
    let minP = Math.min(...pnls);
    let maxP = Math.max(...pnls);
    if (minP === maxP) {
      minP -= 1;
      maxP += 1;
    }
    const innerW = W - 2 * padX;
    const innerH = H - 2 * padY;
    const coords = points.map((pt, i) => {
      const x = padX + (i / (points.length - 1)) * innerW;
      const y = padY + (1 - (pt.pnl - minP) / (maxP - minP)) * innerH;
      return { x, y };
    });
    const line = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`).join(" ");
    const first = coords[0];
    const last = coords[coords.length - 1];
    const area = `${line} L ${last.x.toFixed(2)} ${H - padY} L ${first.x.toFixed(2)} ${H - padY} Z`;
    return { lineD: line, areaD: area };
  }, [points, H, padX, padY, W]);

  const stroke = sober
    ? positive
      ? "#22c55e"
      : "#f87171"
    : positive
      ? "var(--game-cyan)"
      : "var(--game-magenta)";

  const dropClass = sober
    ? positive
      ? "drop-shadow-[0_0_8px_rgba(34,197,94,0.25)]"
      : "drop-shadow-[0_0_8px_rgba(248,113,113,0.25)]"
    : positive
      ? "drop-shadow-[0_0_6px_rgba(65,245,240,0.35)]"
      : "drop-shadow-[0_0_6px_rgba(255,61,154,0.35)]";

  if (points.length < 2) {
    const emptyH = compact ? 36 : 52;
    if (fillHeight) {
      return (
        <div
          className={`flex min-h-[5rem] w-full flex-1 items-center justify-center rounded-sm border text-[10px] uppercase tracking-wider text-zinc-500 ${sober ? "border-zinc-700/50 bg-zinc-950/60" : "border-[var(--game-cyan-dim)]/50 bg-[rgba(4,2,12,0.6)] text-[var(--game-text-muted)]"} ${compact ? "text-[9px]" : ""}`}
        >
          Collecting ticks…
        </div>
      );
    }
    return (
      <div
        className={`flex items-center justify-center rounded-sm border text-[10px] uppercase tracking-wider ${sober ? "border-zinc-700/50 bg-zinc-950/60 text-zinc-500" : "border-[var(--game-cyan-dim)]/50 bg-[rgba(4,2,12,0.6)] text-[var(--game-text-muted)]"} ${compact ? "text-[9px]" : ""}`}
        style={{ minHeight: emptyH, height: emptyH }}
      >
        Collecting ticks…
      </div>
    );
  }

  if (fillHeight) {
    return (
      <div className="flex h-full min-h-[5rem] w-full min-w-0 flex-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#${gradientId})`} />
          <path
            d={lineD}
            fill="none"
            stroke={stroke}
            strokeWidth={1.25}
            vectorEffect="non-scaling-stroke"
            className={dropClass}
          />
        </svg>
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`w-full overflow-visible ${compact ? "h-9" : "h-14"}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path
        d={lineD}
        fill="none"
        stroke={stroke}
        strokeWidth={1.25}
        vectorEffect="non-scaling-stroke"
        className={dropClass}
      />
    </svg>
  );
}

type CardProps = {
  pos: GainsPositionUpdate;
  history: GainsPositionPnlTick[];
  onCloseMarket: () => void;
  closing: boolean;
  canClose: boolean;
  readOnly?: boolean;
  cardLabel?: string;
  compact?: boolean;
  /** Graphique PnL qui occupe l’espace vertical restant (duel live). */
  expandChart?: boolean;
  /** Style sobre + bordure verte/rouge animée selon le mouvement du PnL. */
  liveDuelVisuals?: boolean;
  /** Colonne duel : identité visuelle joueur (cyan = toi, fuchsia = adversaire). */
  duelPlayerSide?: "my" | "opponent";
};

function PositionCard({
  pos,
  history,
  onCloseMarket,
  closing,
  canClose,
  readOnly = false,
  cardLabel = "Live position",
  compact = false,
  expandChart = false,
  liveDuelVisuals = false,
  duelPlayerSide,
}: CardProps) {
  const rawId = useId();
  const gradientId = `pnl-grad-${rawId.replace(/:/g, "")}`;
  const long = isLong(pos);
  const liq = liqPrice(pos);
  const pairLabel = pos.pair?.trim() || `Pair #${pos.pairIndex}`;
  const currentPx =
    typeof pos.currentPriceUsdDecimaled === "number" && Number.isFinite(pos.currentPriceUsdDecimaled)
      ? pos.currentPriceUsdDecimaled
      : null;
  const collateral =
    typeof pos.collateral === "number" && Number.isFinite(pos.collateral) ? pos.collateral : null;
  const pct =
    typeof pos.percentChange === "number" && Number.isFinite(pos.percentChange)
      ? pos.percentChange
      : null;
  const pnlPositive = pos.pnl >= 0;

  const [pnlTrend, setPnlTrend] = useState<"up" | "down" | "flat">("flat");
  const lastPnlRef = useRef<number | null>(null);

  useEffect(() => {
    if (!liveDuelVisuals) return;
    const p = typeof pos.pnl === "number" && Number.isFinite(pos.pnl) ? pos.pnl : null;
    if (p === null) return;
    const prev = lastPnlRef.current;
    if (prev !== null) {
      const eps = 1e-8;
      if (p > prev + eps) setPnlTrend("up");
      else if (p < prev - eps) setPnlTrend("down");
      else setPnlTrend("flat");
    }
    lastPnlRef.current = p;
  }, [pos.pnl, liveDuelVisuals]);

  const trendClass =
    liveDuelVisuals &&
    (pnlTrend === "up"
      ? "duel-live-card--up"
      : pnlTrend === "down"
        ? "duel-live-card--down"
        : "duel-live-card--flat");

  const duelLiveBg =
    liveDuelVisuals && duelPlayerSide === "my"
      ? "bg-[linear-gradient(165deg,rgba(34,211,238,0.1),rgba(9,9,11,0.99)_46%,rgba(15,23,42,0.94))]"
      : liveDuelVisuals && duelPlayerSide === "opponent"
        ? "bg-[linear-gradient(165deg,rgba(232,121,249,0.1),rgba(9,9,11,0.99)_46%,rgba(30,16,42,0.94))]"
        : liveDuelVisuals
          ? "bg-[linear-gradient(165deg,rgba(24,24,27,0.97),rgba(9,9,11,0.99)_48%,rgba(24,24,27,0.95))]"
          : "";

  const liveCardLabelClass =
    liveDuelVisuals && duelPlayerSide === "my"
      ? "text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400/90"
      : liveDuelVisuals && duelPlayerSide === "opponent"
        ? "text-[9px] font-bold uppercase tracking-[0.2em] text-fuchsia-400/90"
        : liveDuelVisuals
          ? "text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500"
          : "";

  const liveTitleClass =
    liveDuelVisuals && duelPlayerSide === "my"
      ? "text-cyan-50 [text-shadow:0_0_18px_rgba(34,211,238,0.25)]"
      : liveDuelVisuals && duelPlayerSide === "opponent"
        ? "text-fuchsia-50 [text-shadow:0_0_18px_rgba(232,121,249,0.28)]"
        : "";

  return (
    <article
      className={`relative flex min-h-0 flex-col overflow-hidden rounded-sm border-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${compact || expandChart ? "h-full" : ""} ${compact ? "p-2.5" : "p-4"} ${
        liveDuelVisuals
          ? `duel-live-card border-zinc-600/40 ${duelLiveBg} ${trendClass || "duel-live-card--flat"}`
          : "border-[var(--game-cyan-dim)] bg-[linear-gradient(165deg,rgba(65,245,240,0.08),rgba(4,2,12,0.92)_45%,rgba(255,61,154,0.05))]"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${liveDuelVisuals ? "bg-[repeating-linear-gradient(-75deg,transparent,transparent_14px,rgba(255,255,255,0.02)_14px,rgba(255,255,255,0.02)_15px)]" : "bg-[repeating-linear-gradient(-75deg,transparent,transparent_14px,rgba(65,245,240,0.025)_14px,rgba(65,245,240,0.025)_15px)]"}`}
      />
      <div className={`relative flex min-h-0 flex-1 flex-col ${compact ? "gap-2" : "gap-3"}`}>
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-2">
          <div>
            <p
              className={`!tracking-[0.18em] ${compact ? "!text-[8px]" : ""} ${liveDuelVisuals ? liveCardLabelClass : gameLabel}`}
            >
              {cardLabel}
            </p>
            <h3
              className={`font-[family-name:var(--font-orbitron)] font-bold tracking-wide ${liveDuelVisuals && liveTitleClass ? liveTitleClass : "text-[var(--game-text)]"} ${compact ? "text-sm sm:text-base" : "text-base sm:text-lg"}`}
            >
              {pairLabel}
            </h3>
            <p
              className={`mt-0.5 font-[family-name:var(--font-share-tech)] text-[var(--game-text-muted)] ${compact ? "text-[9px] leading-tight" : "text-[11px]"}`}
            >
              {pos.chain ? String(pos.chain) : "—"} · index {pos.index ?? 0}
              {pos.tradeType != null ? ` · type ${pos.tradeType}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <span
              className={`rounded-sm border px-2.5 py-1 font-[family-name:var(--font-orbitron)] text-[10px] font-bold uppercase tracking-wider ${
                liveDuelVisuals && duelPlayerSide === "my"
                  ? long
                    ? "border-cyan-400/55 bg-cyan-950/45 text-cyan-100"
                    : "border-cyan-700/45 bg-cyan-950/25 text-cyan-200/80"
                  : liveDuelVisuals && duelPlayerSide === "opponent"
                    ? long
                      ? "border-fuchsia-400/55 bg-fuchsia-950/40 text-fuchsia-100"
                      : "border-fuchsia-800/45 bg-fuchsia-950/25 text-fuchsia-200/80"
                    : liveDuelVisuals
                      ? long
                        ? "border-zinc-500/40 bg-zinc-800/40 text-zinc-200"
                        : "border-zinc-600/40 bg-zinc-900/50 text-zinc-400"
                      : long
                        ? "border-[var(--game-cyan)]/60 bg-[rgba(65,245,240,0.12)] text-[var(--game-cyan)]"
                        : "border-[var(--game-magenta)]/60 bg-[rgba(255,61,154,0.12)] text-[var(--game-magenta)]"
              }`}
            >
              {long ? "Long" : "Short"}
            </span>
            <span
              className={`rounded-sm border px-2.5 py-1 font-[family-name:var(--font-orbitron)] text-[10px] font-bold uppercase tracking-wider ${
                liveDuelVisuals
                  ? "border-amber-500/45 bg-amber-950/35 text-amber-200/95 [text-shadow:0_0_10px_rgba(251,191,36,0.35)]"
                  : "border-[var(--game-amber)]/50 bg-[rgba(255,200,74,0.1)] text-[var(--game-amber)]"
              }`}
            >
              {pos.leverage}×
            </span>
          </div>
        </div>

        <div className={`grid shrink-0 grid-cols-2 sm:grid-cols-4 ${compact ? "gap-2" : "gap-3"}`}>
          <div>
            <p
              className={`${compact ? "!text-[8px]" : ""} ${liveDuelVisuals ? "text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500" : gameLabel}`}
            >
              PnL
            </p>
            <p
              className={`font-[family-name:var(--font-share-tech)] font-semibold tabular-nums ${
                compact ? "text-base sm:text-lg" : "text-lg sm:text-xl"
              } ${
                liveDuelVisuals
                  ? pnlPositive
                    ? "text-emerald-400"
                    : "text-rose-400"
                  : pnlPositive
                    ? "text-[var(--game-cyan)]"
                    : "text-[var(--game-magenta)]"
              }`}
            >
              {pnlPositive ? "+" : ""}
              {fmtUsd(pos.pnl, 4)} USDC
            </p>
            {pct != null ? (
              <p
                className={`text-xs font-medium tabular-nums ${
                  liveDuelVisuals
                    ? pct >= 0
                      ? "text-emerald-400/85"
                      : "text-rose-400/85"
                    : pct >= 0
                      ? "text-[var(--game-cyan)]/90"
                      : "text-[var(--game-magenta)]/90"
                }`}
              >
                {fmtSignedPct(pct)} session
              </p>
            ) : null}
          </div>
          <div>
            <p
              className={`${compact ? "!text-[8px]" : ""} ${liveDuelVisuals ? "text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500" : gameLabel}`}
            >
              Entry
            </p>
            <p
              className={`font-[family-name:var(--font-share-tech)] font-medium tabular-nums text-[var(--game-text)] ${compact ? "text-xs" : "text-sm"}`}
            >
              ${fmtUsd(pos.openPrice, 2)}
            </p>
          </div>
          <div>
            <p
              className={`${compact ? "!text-[8px]" : ""} ${liveDuelVisuals ? "text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500" : gameLabel}`}
            >
              Mark
            </p>
            <p
              className={`font-[family-name:var(--font-share-tech)] font-medium tabular-nums text-[var(--game-text)] ${compact ? "text-xs" : "text-sm"}`}
            >
              {currentPx != null ? `$${fmtUsd(currentPx, 2)}` : "—"}
            </p>
          </div>
          <div>
            <p
              className={`${compact ? "!text-[8px]" : ""} ${liveDuelVisuals ? "text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500" : gameLabel}`}
            >
              Collateral
            </p>
            <p
              className={`font-[family-name:var(--font-share-tech)] font-medium tabular-nums text-[var(--game-text)] ${compact ? "text-xs" : "text-sm"}`}
            >
              {collateral != null ? `${fmtUsd(collateral, 2)} USDC` : "—"}
            </p>
          </div>
        </div>

        {liq != null ? (
          <p
            className={`${gameMuted} shrink-0 font-[family-name:var(--font-share-tech)] ${compact ? "text-[9px] leading-tight" : "text-[11px]"}`}
          >
            Liquidation ≈{" "}
            <span className={liveDuelVisuals ? "text-zinc-400" : "text-[var(--game-amber)]"}>
              ${fmtUsd(liq, 2)}
            </span>
          </p>
        ) : null}

        <div
          className={`flex flex-col rounded-sm border bg-[rgba(0,0,0,0.35)] ${
            liveDuelVisuals ? "border-zinc-700/45" : "border-[var(--game-cyan-dim)]/40"
          } ${expandChart ? "min-h-0 flex-1" : ""} ${compact ? "space-y-1 px-2 py-1.5" : "space-y-1.5 px-3 py-2"}`}
        >
          <p
            className={`shrink-0 ${compact ? "!text-[8px]" : "!text-[9px]"} ${liveDuelVisuals ? "text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-500" : gameLabel}`}
          >
            PnL evolution (live)
          </p>
          {expandChart ? (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <PnlSparkline
                points={history}
                positive={pnlPositive}
                gradientId={gradientId}
                compact={compact}
                fillHeight
                sober={liveDuelVisuals}
              />
            </div>
          ) : (
            <PnlSparkline
              points={history}
              positive={pnlPositive}
              gradientId={gradientId}
              compact={compact}
              sober={liveDuelVisuals}
            />
          )}
        </div>

        {/* Même hauteur que la carte « ton » trade : zone footer fixe (readOnly = emplacement réservé). */}
        <div
          className={`mt-auto flex flex-col justify-end border-t ${liveDuelVisuals ? "border-zinc-700/40" : "border-[var(--game-cyan-dim)]/30"} ${compact ? "min-h-[4.75rem] pt-2" : "min-h-[7.5rem] pt-3"}`}
        >
          {readOnly ? (
            <div className="pointer-events-none select-none opacity-0" aria-hidden>
              <p className={`${gameMuted} mb-2 ${compact ? "text-[9px] leading-tight" : "text-[11px]"}`}>
                <code className="text-[var(--game-cyan)]">closeTradeMarket</code>(tradeIndex, expectedPrice) — index{" "}
                <span className="font-[family-name:var(--font-share-tech)] text-[var(--game-text)]">0</span>, prix mark $0 → uint64 1e10
              </p>
              <button
                type="button"
                tabIndex={-1}
                className={`w-full rounded-sm border font-[family-name:var(--font-orbitron)] font-bold uppercase tracking-wider transition disabled:opacity-40 ${liveDuelVisuals ? "border-rose-900/45 bg-rose-950/25 text-rose-200/90 enabled:hover:bg-rose-950/40" : gameBtnDanger} ${compact ? "py-1.5 text-[10px]" : "py-2 text-xs"}`}
              >
                Close market
              </button>
            </div>
          ) : (
            <>
              <p className={`${gameMuted} mb-2 ${compact ? "text-[9px] leading-tight" : "text-[11px]"}`}>
                <code className="text-[var(--game-cyan)]">closeTradeMarket</code>(tradeIndex, expectedPrice) — index{" "}
                <span className="font-[family-name:var(--font-share-tech)] text-[var(--game-text)]">
                  {pos.index ?? 0}
                </span>
                , prix mark{" "}
                {currentPx != null ? (
                  <span className="font-[family-name:var(--font-share-tech)] text-[var(--game-text)]">
                    ${fmtUsd(currentPx, 2)}
                  </span>
                ) : (
                  "—"
                )}{" "}
                → uint64 1e10
              </p>
              <button
                type="button"
                disabled={!canClose || closing}
                onClick={onCloseMarket}
                className={`rounded-sm border font-[family-name:var(--font-orbitron)] font-bold uppercase tracking-wider transition disabled:opacity-40 ${liveDuelVisuals ? "border-rose-900/45 bg-rose-950/25 text-rose-200/90 enabled:hover:bg-rose-950/40" : gameBtnDanger} ${compact ? "py-1.5 text-[10px]" : "py-2 text-xs"}`}
              >
                {closing ? "Closing…" : "Close market"}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export type GainsLivePositionsPanelProps = {
  positions: GainsPositionUpdate[];
  pnlHistoryByKey: ReadonlyMap<string, GainsPositionPnlTick[]>;
  connectionState: "idle" | "connecting" | "open" | "closed" | "error";
  lastWsError: string | null;
  gainsWallet: string | null;
  gainsChain: GainsApiChain;
  /** UUID duel envoyé au WS `subscribe` (stream par match). */
  wsDuelId?: string;
  /** Titre de la carte (colonne adversaire / moi). */
  panelTitle?: string;
  /** Masque fermeture marché et aide close (positions adversaire). */
  readOnly?: boolean;
  /** Clé dans `pnlHistoryByKey` (doit correspondre au contexte duel). */
  historyKeyForPosition?: (pos: GainsPositionUpdate) => string;
  /** Libellé sous-titre de chaque carte position. */
  positionCardLabel?: string;
  /** Fin du timer duel : message + pas d’actions close. */
  duelEnded?: boolean;
  /** Afficher la ligne socket / wallet (désactiver sur la 2ᵉ colonne si doublon). */
  showConnectionMeta?: boolean;
  /** Classes sur le conteneur (ex. `h-full` pour colonnes duel égales). */
  className?: string;
  /** Mise en page resserrée (duel live plein écran). */
  compact?: boolean;
  /** Fait grandir le graphique PnL pour remplir la hauteur (duel live). */
  expandChart?: boolean;
  /** Duel en cours : panneau sobre + cartes vert/rouge animées. */
  liveDuelVisuals?: boolean;
  /** Colonne duel : teinte identité joueur (voir PositionCard). */
  duelPlayerSide?: "my" | "opponent";
};

export function GainsLivePositionsPanel({
  positions,
  pnlHistoryByKey,
  connectionState,
  lastWsError,
  gainsWallet,
  gainsChain,
  wsDuelId = "",
  panelTitle = "Gains positions (WebSocket)",
  readOnly = false,
  historyKeyForPosition = gainsPositionStreamKey,
  positionCardLabel,
  duelEnded = false,
  showConnectionMeta = true,
  className = "",
  compact = false,
  expandChart = false,
  liveDuelVisuals = false,
  duelPlayerSide,
}: GainsLivePositionsPanelProps) {
  const [closingKey, setClosingKey] = useState<string | null>(null);
  const [closeTx, setCloseTx] = useState<string | null>(null);
  const [closeErr, setCloseErr] = useState<string | null>(null);

  const closePosition = useCallback(
    async (pos: GainsPositionUpdate) => {
      const key = historyKeyForPosition(pos);
      const mark =
        typeof pos.currentPriceUsdDecimaled === "number" &&
        Number.isFinite(pos.currentPriceUsdDecimaled)
          ? pos.currentPriceUsdDecimaled
          : null;
      if (mark == null) return;

      setCloseErr(null);
      setCloseTx(null);
      setClosingKey(key);
      try {
        const r = await fetch("/api/trade/close-market", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            tradeIndex: pos.index ?? 0,
            currentPriceUsdDecimaled: mark,
            gainsChain,
          }),
        });
        const data = (await r.json()) as { error?: string; txHash?: string };
        if (!r.ok) {
          setCloseErr(data.error ?? "Close failed.");
          return;
        }
        if (data.txHash) {
          setCloseTx(data.txHash);
        }
      } catch {
        setCloseErr("Network error.");
      } finally {
        setClosingKey(null);
      }
    },
    [historyKeyForPosition, gainsChain],
  );

  const cards = useMemo(() => {
    return positions.map((pos) => {
      const key = historyKeyForPosition(pos);
      return {
        pos,
        key,
        history: pnlHistoryByKey.get(key) ?? [],
      };
    });
  }, [positions, pnlHistoryByKey, historyKeyForPosition]);

  const markReady = (p: GainsPositionUpdate) =>
    typeof p.currentPriceUsdDecimaled === "number" && Number.isFinite(p.currentPriceUsdDecimaled);

  const panelShell = liveDuelVisuals
    ? duelLiveSoberShell
    : `${gamePanel} ${gamePanelTopAccent}`;

  const duelColumnAccent =
    liveDuelVisuals && duelPlayerSide === "my"
      ? "border-l-[3px] border-l-cyan-400/60 shadow-[inset_4px_0_20px_-4px_rgba(34,211,238,0.12)]"
      : liveDuelVisuals && duelPlayerSide === "opponent"
        ? "border-l-[3px] border-l-fuchsia-400/60 shadow-[inset_4px_0_20px_-4px_rgba(232,121,249,0.12)]"
        : "";

  const panelTitleClass =
    liveDuelVisuals && duelPlayerSide === "my"
      ? "text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400/95"
      : liveDuelVisuals && duelPlayerSide === "opponent"
        ? "text-[9px] font-bold uppercase tracking-[0.2em] text-fuchsia-400/95"
        : liveDuelVisuals
          ? "text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500"
          : "";

  return (
    <div
      className={`${panelShell} ${duelColumnAccent} relative flex min-h-0 flex-col text-xs ${expandChart ? "overflow-hidden" : ""} ${compact ? "space-y-2 p-2.5" : "space-y-4 p-4"} ${className}`.trim()}
    >
      <div className={`shrink-0 ${compact ? "space-y-0.5" : "space-y-1"}`}>
        <p
          className={`${compact ? "!text-[8px]" : ""} ${liveDuelVisuals ? panelTitleClass : gameLabel}`}
        >
          {panelTitle}
        </p>
        {showConnectionMeta ? (
          <p className={gameMuted}>
            Socket: {connectionState}
            {gainsWallet ? (
              <span className="text-[var(--game-text-muted)]"> · {gainsWallet.slice(0, 6)}…</span>
            ) : (
              <span className="text-[var(--game-amber)]"> · no wallet on session</span>
            )}
          </p>
        ) : null}
      </div>
      {duelEnded ? (
        <p
          className={`rounded-sm border font-[family-name:var(--font-share-tech)] text-[var(--game-text)] ${liveDuelVisuals ? "border-zinc-600/50 bg-zinc-900/50" : "border-[var(--game-magenta)]/40 bg-[rgba(255,61,154,0.08)]"} ${compact ? "px-2 py-1 text-[9px] leading-tight" : "px-3 py-2 text-[11px]"}`}
        >
          Timer ended: this duel’s positions are treated as closed on the server.
        </p>
      ) : null}
      {connectionState === "idle" && gainsWallet && showConnectionMeta ? (
        <p className={gameMuted}>
          Set <code className="text-[var(--game-cyan)]">NEXT_PUBLIC_DUEL_DEFI_WS_URL</code> (e.g.{" "}
          <code className="break-all text-[10px] text-[var(--game-text-muted)]">
            ws://46.202.173.162:3001/ws/positions
          </code>
          ) to stream live positions.
        </p>
      ) : null}
      {lastWsError ? <p className="text-sm text-[var(--game-danger)]">{lastWsError}</p> : null}

      {positions.length > 0 && !readOnly ? (
        <>
          {closeErr ? <p className="text-sm text-[var(--game-danger)]">{closeErr}</p> : null}
          {closeTx ? (
            <p className="break-all font-[family-name:var(--font-share-tech)] text-[11px] text-[var(--game-cyan)]">
              Close tx: {closeTx}
            </p>
          ) : null}
        </>
      ) : null}

      {positions.length > 0 ? (
        <ul
          className={`flex flex-col ${compact ? "gap-2" : "gap-4"} ${compact || expandChart ? "min-h-0 flex-1" : ""}`}
        >
          {cards.map(({ pos, key, history }, i) => (
            <li
              key={`${key}-${i}`}
              className={`flex min-w-0 flex-col ${compact || expandChart ? "min-h-0 flex-1" : ""}`}
            >
              <PositionCard
                pos={pos}
                history={history}
                onCloseMarket={() => void closePosition(pos)}
                closing={closingKey === key}
                canClose={markReady(pos)}
                readOnly={readOnly || duelEnded}
                cardLabel={positionCardLabel ?? "Live position"}
                compact={compact}
                expandChart={expandChart}
                liveDuelVisuals={liveDuelVisuals}
                duelPlayerSide={duelPlayerSide}
              />
            </li>
          ))}
        </ul>
      ) : connectionState === "open" ? (
        <p className={gameMuted}>
          {duelEnded ? (
            <>No positions shown (duel ended).</>
          ) : (
            <>
              Waiting for position ticks
              {wsDuelId.trim() ? (
                <>
                  {" "}
                  (<code className="text-[var(--game-cyan)]">subscribe</code> duel{" "}
                  <span className="font-[family-name:var(--font-share-tech)] text-[var(--game-text)]">
                    {wsDuelId.slice(0, 8)}…
                  </span>
                  )
                </>
              ) : (
                <> ({gainsChain})</>
              )}
              …
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}

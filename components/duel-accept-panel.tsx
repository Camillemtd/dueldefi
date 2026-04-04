"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { parseUnits } from "viem";

import {
  gameBtnPrimary,
  gameLabel,
  gameMuted,
  gamePanel,
  gamePanelTopAccent,
  gameTabActive,
  gameTabRow,
  gameTitle,
} from "@/components/game-ui";
import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";

type DuelApi = {
  id: string;
  creatorPseudo: string;
  opponentPseudo: string | null;
  stakeUsdc: string;
  durationSeconds: number;
  createdAt: string;
  duelFull: boolean;
  viewer: { isCreator: boolean; isOpponent: boolean } | null;
};

type BalanceApi = {
  configured: boolean;
  balanceRaw?: string;
  decimals?: number;
  formatted?: string;
  error?: string;
};

type Props = { duelId: string };

function formatUsdcLabel(raw: string) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(n);
}

export function DuelAcceptPanel({ duelId }: Props) {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [duel, setDuel] = useState<DuelApi | null>(null);
  const [duelError, setDuelError] = useState<string | null>(null);
  const [duelLoading, setDuelLoading] = useState(true);
  const [balance, setBalance] = useState<BalanceApi | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const loadDuel = useCallback(async () => {
    setDuelError(null);
    setDuelLoading(true);
    try {
      const r = await fetch(`/api/duels/${duelId}`, { credentials: "include" });
      const data = (await r.json()) as DuelApi & { error?: string };
      if (!r.ok) {
        setDuel(null);
        setDuelError(data.error ?? "Duel introuvable.");
        return;
      }
      setDuel(data);
    } catch {
      setDuel(null);
      setDuelError("Erreur réseau.");
    } finally {
      setDuelLoading(false);
    }
  }, [duelId]);

  const loadBalance = useCallback(async () => {
    setBalanceLoading(true);
    setBalance(null);
    try {
      const r = await fetch("/api/wallet/collateral-balance", { credentials: "include" });
      const data = (await r.json()) as BalanceApi & { error?: string };
      if (r.status === 401) {
        setBalance({ configured: false, error: "Session expirée : reconnecte-toi." });
        return;
      }
      setBalance({
        configured: Boolean(data.configured),
        balanceRaw: data.balanceRaw,
        decimals: data.decimals,
        formatted: data.formatted,
        error: data.error,
      });
    } catch {
      setBalance({ configured: false, error: "Erreur réseau." });
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDuel();
  }, [loadDuel]);

  const shouldLoadBalance =
    duel?.viewer &&
    !duel.viewer.isCreator &&
    !duel.viewer.isOpponent &&
    !duel.duelFull;

  useEffect(() => {
    if (!shouldLoadBalance) return;
    void loadBalance();
  }, [shouldLoadBalance, loadBalance]);

  const canAccept = useMemo(() => {
    if (!duel || !balance?.configured || !balance.balanceRaw) return false;
    try {
      const need = parseUnits(duel.stakeUsdc, 6);
      return BigInt(balance.balanceRaw) >= need;
    } catch {
      return false;
    }
  }, [duel, balance]);

  async function onJoin() {
    setJoinError(null);
    setJoinLoading(true);
    try {
      const r = await fetch(`/api/duels/${duelId}/join`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await r.json()) as { error?: string };
      if (!r.ok) {
        setJoinError(data.error ?? "Impossible d’accepter le duel.");
        return;
      }
      await loadDuel();
    } catch {
      setJoinError("Erreur réseau.");
    } finally {
      setJoinLoading(false);
    }
  }

  if (duelLoading) {
    return (
      <p className={`${gameMuted} font-[family-name:var(--font-orbitron)] text-xs uppercase tracking-widest`}>
        Chargement…
      </p>
    );
  }

  if (duelError || !duel) {
    return (
      <p className="rounded-sm border border-[var(--game-danger)]/50 bg-[rgba(255,68,102,0.12)] px-3 py-2 text-sm text-[var(--game-danger)]">
        {duelError ?? "Duel introuvable."}
      </p>
    );
  }

  if (!duel.viewer) {
    return (
      <div className={`${gamePanel} ${gamePanelTopAccent} space-y-4 p-6`}>
        <div className="space-y-2">
          <p className={gameLabel}>Invité</p>
          <h2 className={`${gameTitle} text-lg sm:text-xl`}>Rejoindre l’arène</h2>
          <p className={gameMuted}>
            Connecte-toi ou crée un compte. Ensuite tu verras ton solde USDC sur le wallet du compte : il
            doit couvrir la mise ({formatUsdcLabel(duel.stakeUsdc)} USDC) pour accepter.
          </p>
        </div>
        <div className={gameTabRow}>
          <button
            type="button"
            onClick={() => setAuthMode("login")}
            className={`flex-1 rounded-sm py-2.5 text-xs font-bold uppercase tracking-wider transition ${gameTabActive(authMode === "login")}`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("signup")}
            className={`flex-1 rounded-sm py-2.5 text-xs font-bold uppercase tracking-wider transition ${gameTabActive(authMode === "signup")}`}
          >
            Créer un compte
          </button>
        </div>
        {authMode === "login" ? (
          <LoginForm onSuccess={() => void loadDuel()} />
        ) : (
          <SignupForm onSuccess={() => void loadDuel()} />
        )}
      </div>
    );
  }

  if (duel.viewer.isCreator) {
    return (
      <div className={`${gamePanel} ${gamePanelTopAccent} space-y-3 p-6`}>
        <p className={gameLabel}>Hôte</p>
        <p className="font-[family-name:var(--font-orbitron)] text-sm font-bold uppercase text-[var(--game-text)]">
          Tu contrôles cette arène
        </p>
        <p className={gameMuted}>
          Envoie le lien à ton adversaire : il devra se connecter, puis accepter avec un wallet qui a
          au moins {formatUsdcLabel(duel.stakeUsdc)} USDC sur la chaîne du faucet.
        </p>
        {duel.duelFull ? (
          <Link href={`/duel/${duelId}/prepare`} className={`${gameBtnPrimary} mt-2 !w-auto px-5`}>
            Configurer mon trade
          </Link>
        ) : null}
      </div>
    );
  }

  if (duel.viewer.isOpponent) {
    return (
      <div className={`${gamePanel} ${gamePanelTopAccent} space-y-3 p-6`}>
        <p className={gameLabel}>Combattant</p>
        <p className="font-[family-name:var(--font-orbitron)] text-sm font-bold uppercase text-[var(--game-text)]">
          Tu es dans le match
        </p>
        <p className={gameMuted}>
          Adversaire : <span className="font-semibold text-[var(--game-cyan)]">{duel.creatorPseudo}</span>
          . Configure ton trade puis marque-toi prêt en même temps que l’hôte.
        </p>
        <Link href={`/duel/${duelId}/prepare`} className={`${gameBtnPrimary} mt-2 !w-auto px-5`}>
          Configurer mon trade
        </Link>
      </div>
    );
  }

  if (duel.duelFull) {
    return (
      <div className={`${gamePanel} border-[var(--game-magenta-dim)] p-6`}>
        <p className={gameLabel}>Match verrouillé</p>
        <p className="font-[family-name:var(--font-orbitron)] text-sm font-bold text-[var(--game-text)]">
          {duel.creatorPseudo} <span className="text-[var(--game-amber)]">VS</span>{" "}
          {duel.opponentPseudo ?? "?"}
        </p>
        <p className={`${gameMuted} mt-2`}>Tu ne peux pas rejoindre cette partie.</p>
      </div>
    );
  }

  return (
    <div className={`${gamePanel} ${gamePanelTopAccent} space-y-4 p-6`}>
      <div className="space-y-2">
        <p className={gameLabel}>Dernière ligne droite</p>
        <h2 className={`${gameTitle} text-lg sm:text-xl`}>Accepter le duel</h2>
        <p className={gameMuted}>
          Mise requise (chacun) :{" "}
          <span className="font-[family-name:var(--font-share-tech)] font-medium text-[var(--game-cyan)]">
            {formatUsdcLabel(duel.stakeUsdc)} USDC
          </span>
        </p>
      </div>

      {balanceLoading ? (
        <p className={`${gameMuted} font-[family-name:var(--font-orbitron)] text-xs uppercase tracking-wider`}>
          Lecture du solde…
        </p>
      ) : null}

      {!balanceLoading && balance ? (
        <div className={`space-y-2 text-sm ${gameMuted}`}>
          {!balance.configured ? (
            <p className="rounded-sm border border-[var(--game-amber)]/40 bg-[rgba(255,200,74,0.1)] px-3 py-2 text-[var(--game-amber)]">
              {balance.error ??
                "Solde indisponible : vérifie FAUCET_RPC_URL et GNS_COLLATERAL_TOKEN_ADDRESS."}
            </p>
          ) : (
            <>
              <p>
                <span className="text-[var(--game-text-muted)]">Ton solde : </span>
                <span className="font-[family-name:var(--font-share-tech)] font-medium text-[var(--game-text)]">
                  {balance.formatted} USDC
                </span>
              </p>
              {!canAccept ? (
                <p className="text-[var(--game-danger)]">
                  Solde insuffisant pour couvrir la mise. Utilise le faucet (getFreeDai) ou transfère
                  des USDC sur ce wallet.
                </p>
              ) : (
                <p className="text-[var(--game-cyan)]">Prêt à entrer : solde OK.</p>
              )}
            </>
          )}
        </div>
      ) : null}

      {joinError ? (
        <p className="rounded-sm border border-[var(--game-danger)]/50 bg-[rgba(255,68,102,0.12)] px-3 py-2 text-sm text-[var(--game-danger)]">
          {joinError}
        </p>
      ) : null}

      <button
        type="button"
        disabled={joinLoading || !canAccept || !balance?.configured}
        onClick={() => void onJoin()}
        className={gameBtnPrimary}
      >
        {joinLoading ? "Enregistrement…" : "Entrer dans l’arène"}
      </button>
    </div>
  );
}

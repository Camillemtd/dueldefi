"use client";

import { type FormEvent, useState } from "react";

import { gameBtnPrimary, gameInput, gameLabel, gameMuted, gamePanel, gamePanelTopAccent, gameTitle } from "@/components/game-ui";

type Props = {
  onSuccess?: () => void | Promise<void>;
};

export function SignupForm({ onSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pseudo: username, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setUsername("");
      setPassword("");
      await onSuccess?.();
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`${gamePanel} ${gamePanelTopAccent} mx-auto w-full max-w-md space-y-6 p-8`}
    >
      <div className="space-y-2">
        <p className={gameLabel}>Nouveau combattant</p>
        <h1 className={`${gameTitle} text-xl sm:text-2xl`}>Créer un compte</h1>
        <p className={gameMuted}>
          Choisis un pseudo et un mot de passe. Un wallet Dynamic est créé côté serveur ; le même mot de passe sert à signer tes trades.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="username" className={gameLabel}>
            Pseudo
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            minLength={2}
            maxLength={32}
            value={username}
            onChange={(ev) => setUsername(ev.target.value)}
            className={gameInput}
            placeholder="ton_pseudo"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className={gameLabel}>
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            className={gameInput}
            placeholder="8 caractères minimum"
          />
        </div>
      </div>

      {error ? (
        <p
          className="rounded-sm border border-[var(--game-danger)]/50 bg-[rgba(255,68,102,0.12)] px-3 py-2 text-sm text-[var(--game-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={loading} className={gameBtnPrimary}>
        {loading ? "Création…" : "Créer compte + wallet"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhosphorIcon } from "@/components/ui/PhosphorIcon";
import {
  STANDINGS_PROVIDER_LABELS,
  type ProjectIntegration,
  type StandingsProvider,
} from "@/lib/types-user";

const PROVIDERS: StandingsProvider[] = ["spordle", "planiligue", "matchify"];

// ── Connected state ──────────────────────────────────────────────────────────

function ConnectedView({
  projectId,
  integration,
}: {
  projectId: string;
  integration: ProjectIntegration;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const providerLabel = STANDINGS_PROVIDER_LABELS[integration.provider];
  const configUrl =
    (integration.config.leagueUrl as string | undefined) ??
    (integration.config.leagueId as string | undefined) ??
    "";

  const lastSync = integration.last_sync_at
    ? new Date(integration.last_sync_at).toLocaleString("fr-CA", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const refresh = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await fetch(
      `/api/standings/${integration.provider}/sync`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          config: integration.config,
        }),
      },
    );

    setLoading(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Synchronisation échouée.");
      return;
    }
    setMessage("Données mises à jour.");
    router.refresh();
  };

  return (
    <div className="max-w-lg space-y-6">
      {/* Connected badge */}
      <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/5 px-4 py-3">
        <PhosphorIcon name="check-circle" className="size-4 text-success shrink-0" />
        <span className="text-sm font-medium text-foreground">
          {providerLabel} connecté
        </span>
      </div>

      {/* URL (read-only) */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">
          {integration.provider === "matchify" ? "ID de la ligue" : "URL de la ligue"}
        </p>
        <p className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-muted break-all">
          {configUrl}
        </p>
      </div>

      {lastSync && (
        <p className="text-xs text-muted">
          Dernière synchronisation : {lastSync}
        </p>
      )}

      <button
        type="button"
        onClick={refresh}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
      >
        <PhosphorIcon
          name="arrow-clockwise"
          className={loading ? "animate-spin" : ""}
        />
        {loading ? "Synchronisation…" : "Rafraîchir les données"}
      </button>

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

// ── Initial connection form ───────────────────────────────────────────────────

function ConnectForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [provider, setProvider] = useState<StandingsProvider>("planiligue");
  const [leagueUrl, setLeagueUrl] = useState("");
  const [leagueId, setLeagueId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setLoading(true);
    setError(null);

    const config =
      provider === "matchify"
        ? { leagueId: leagueId.trim() }
        : { leagueUrl: leagueUrl.trim() };

    const res = await fetch(`/api/standings/${provider}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, config }),
    });

    setLoading(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Connexion échouée.");
      return;
    }
    router.refresh();
  };

  return (
    <div className="max-w-lg space-y-6">
      <p className="text-sm text-muted">
        Collez l&apos;URL publique de votre ligue Planiligue (page équipes,
        horaire ou classement). Nous importons le classement, les équipes et
        l&apos;horaire. Spordle et Matchify.ca sont aussi disponibles.
      </p>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="provider">
          Plateforme
        </label>
        <select
          id="provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value as StandingsProvider)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
        >
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {STANDINGS_PROVIDER_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      {provider === "matchify" ? (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="leagueId">
            ID ligue Matchify
          </label>
          <input
            id="leagueId"
            type="text"
            value={leagueId}
            onChange={(e) => setLeagueId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="leagueUrl">
            URL {STANDINGS_PROVIDER_LABELS[provider]}
          </label>
          <input
            id="leagueUrl"
            type="url"
            placeholder={
              provider === "planiligue"
                ? "https://www.planiligue.com/tournois/futsal/canada/quebec/equipes/…"
                : "https://…"
            }
            value={leagueUrl}
            onChange={(e) => setLeagueUrl(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>
      )}

      <button
        type="button"
        onClick={connect}
        disabled={loading}
        className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
      >
        {loading ? "Connexion…" : "Connecter la ligue"}
      </button>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

// ── Entry point ───────────────────────────────────────────────────────────────

export function IntegrationsPanel({
  projectId,
  existing,
}: {
  projectId: string;
  existing: ProjectIntegration | null;
}) {
  if (existing) {
    return <ConnectedView projectId={projectId} integration={existing} />;
  }
  return <ConnectForm projectId={projectId} />;
}

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

      {/* League link */}
      {configUrl.startsWith("http") ? (
        <a
          href={configUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-input bg-surface px-5 py-2 text-sm font-medium text-foreground hover:border-primary/40 hover:bg-accent transition-colors"
        >
          <PhosphorIcon name="arrow-square-out" className="size-4" />
          Visiter la ligue
        </a>
      ) : (
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">ID de la ligue</p>
          <p className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-muted">
            {configUrl}
          </p>
        </div>
      )}

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

type DivisionOption = { id: string | null; name: string };
type PreviewData = { leagueName: string; divisions: DivisionOption[] };

function appendFilterDivision(url: string, divisionId: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("filter_division", divisionId);
    return u.toString();
  } catch {
    return url;
  }
}

function ConnectForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [provider, setProvider] = useState<StandingsProvider>("planiligue");
  const [leagueUrl, setLeagueUrl] = useState("");
  const [leagueId, setLeagueId] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const baseConfig =
    provider === "matchify"
      ? { leagueId: leagueId.trim() }
      : { leagueUrl: leagueUrl.trim() };

  const previewLeague = async () => {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/standings/${provider}/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: baseConfig }),
    });

    setLoading(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Connexion échouée.");
      return;
    }
    const data = body as PreviewData;
    setPreview(data);
    setSelectedDivisionId(data.divisions.length === 1 ? data.divisions[0].id : null);
  };

  const confirm = async () => {
    if (!preview) return;
    const needsSelection = preview.divisions.length > 1;
    if (needsSelection && !selectedDivisionId) return;

    setConfirming(true);
    setError(null);

    const syncConfig =
      selectedDivisionId && provider !== "matchify"
        ? { ...baseConfig, leagueUrl: appendFilterDivision(baseConfig.leagueUrl as string, selectedDivisionId) }
        : baseConfig;

    const res = await fetch(`/api/standings/${provider}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, config: syncConfig }),
    });

    setConfirming(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPreview(null);
      setError(body.error ?? "Connexion échouée.");
      return;
    }
    router.refresh();
  };

  const multiDivision = (preview?.divisions.length ?? 0) > 1;

  return (
    <>
      <div className="max-w-lg space-y-6">
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
          onClick={previewLeague}
          disabled={loading}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
        >
          {loading ? "Chargement…" : "Connecter la ligue"}
        </button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md space-y-5 rounded-lg border border-border bg-surface p-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Confirmer la connexion</h3>
              <p className="mt-1 text-sm text-muted">
                {multiDivision
                  ? "Sélectionnez la division à connecter."
                  : "Vérifiez que ces informations correspondent bien à votre ligue avant de confirmer."}
              </p>
            </div>

            <div className="space-y-3 rounded-md border border-border bg-surface-2 p-4">
              {preview.leagueName ? (
                <div className="space-y-0.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Ligue</p>
                  <p className="text-sm font-medium text-foreground">{preview.leagueName}</p>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Division</p>
                {multiDivision ? (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {preview.divisions.map((div) => (
                      <label
                        key={div.id ?? div.name}
                        className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-surface transition-colors"
                      >
                        <input
                          type="radio"
                          name="division"
                          value={div.id ?? div.name}
                          checked={selectedDivisionId === div.id}
                          onChange={() => setSelectedDivisionId(div.id)}
                          className="accent-primary"
                        />
                        <span className="text-sm text-foreground">{div.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    {preview.divisions[0]?.name || <span className="italic text-muted">Non disponible</span>}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreview(null)}
                disabled={confirming}
                className="rounded-md px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={confirming || (multiDivision && !selectedDivisionId)}
                className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
              >
                {confirming ? "Connexion…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
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

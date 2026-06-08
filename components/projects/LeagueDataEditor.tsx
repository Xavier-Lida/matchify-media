"use client";

import { useState, useRef, useMemo } from "react";
import type {
  UnifiedLeagueData,
  LeagueTeamEntry,
  LeagueMatchEntry,
} from "@/lib/types-user";

// ---- Upload helper ----

async function uploadLogo(projectId: string, file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`/api/projects/${projectId}/league-logo`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Upload échoué.");
  }
  const { url } = (await res.json()) as { url: string };
  return url;
}

// ---- Logo button (upload + preview) ----

function LogoButton({
  url,
  onUpload,
  size = "sm",
}: {
  url: string | null;
  onUpload: (url: string) => void;
  size?: "sm" | "lg";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const sizeClass =
    size === "lg"
      ? "h-16 w-16 rounded-xl text-xs"
      : "h-8 w-8 rounded-md text-[10px]";

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          e.target.value = "";
          setUploading(true);
          setUploadError(null);
          try {
            const form = inputRef.current?.closest("[data-project-id]");
            const projectId = form?.getAttribute("data-project-id") ?? "";
            const uploaded = await uploadLogo(projectId, file);
            onUpload(uploaded);
          } catch (err) {
            setUploadError(
              err instanceof Error ? err.message : "Upload échoué.",
            );
          } finally {
            setUploading(false);
          }
        }}
      />
      <button
        type="button"
        title="Changer le logo"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`${sizeClass} border-2 border-dashed border-border bg-surface-2 flex items-center justify-center overflow-hidden relative hover:border-primary/50 transition-colors disabled:opacity-60`}
      >
        {url ? (
          <img src={url} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className="text-muted leading-tight text-center px-0.5">
            Logo
          </span>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-[10px]">…</span>
          </div>
        )}
      </button>
      {uploadError && (
        <p className="absolute top-full left-0 mt-1 text-[10px] text-red-500 whitespace-nowrap z-10">
          {uploadError}
        </p>
      )}
    </div>
  );
}

// ---- Team logo circle (read-only display) ----

function TeamLogo({ url }: { url?: string | null }) {
  return (
    <div className="h-10 w-10 rounded-full border border-border bg-surface-2 flex items-center justify-center overflow-hidden shrink-0">
      {url ? (
        <img src={url} alt="" className="h-full w-full object-contain" />
      ) : null}
    </div>
  );
}

// ---- Standings (read-only + editable logos) ----

function StandingsSection({
  teams,
  onTeamLogoUpload,
  onChange,
}: {
  teams: LeagueTeamEntry[];
  onTeamLogoUpload: (index: number, url: string) => void;
  onChange: (teams: LeagueTeamEntry[]) => void;
}) {
  if (teams.length === 0) {
    return (
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Classement</h3>
        <p className="text-sm text-muted">
          Aucune donnée. Synchronisez un fournisseur pour importer le classement.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Classement</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-xs text-muted border-b border-border">
              <th className="w-8 text-center pb-2 font-normal">#</th>
              <th className="w-8 pb-2 font-normal"></th>
              <th className="text-left pb-2 font-normal pl-2 min-w-[140px]">
                Équipe
              </th>
              {["PJ", "V", "N", "D", "BP", "BC", "Diff", "Pts"].map((h) => (
                <th
                  key={h}
                  className="w-10 text-center pb-2 font-normal shrink-0"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((team, i) => (
              <tr
                key={i}
                className="border-b border-border/50 hover:bg-surface-2/50"
              >
                <td className="text-center text-muted py-2 text-xs">{i + 1}</td>
                <td className="py-2">
                  <LogoButton
                    url={team.logo}
                    size="sm"
                    onUpload={(url) => onTeamLogoUpload(i, url)}
                  />
                </td>
                <td className="py-2 pl-2 font-medium">{team.name}</td>
                {(
                  ["pj", "v", "n", "d", "bp", "bc", "diff", "pts"] as const
                ).map((f) => (
                  <td
                    key={f}
                    className="w-10 text-center py-2 text-muted tabular-nums"
                  >
                    {team[f] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---- Schedule (read-only cards) ----

function formatDateHeader(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return dateStr.toUpperCase();
  return d
    .toLocaleDateString("fr-CA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d
    .toLocaleDateString("fr-CA", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    .toUpperCase();
}

function groupByDate(
  matches: LeagueMatchEntry[],
): [string, LeagueMatchEntry[]][] {
  const sorted = [...matches].sort((a, b) => {
    const dc = (a.date || "").localeCompare(b.date || "");
    return dc !== 0 ? dc : (a.time || "").localeCompare(b.time || "");
  });
  const map = new Map<string, LeagueMatchEntry[]>();
  for (const m of sorted) {
    const key = m.date || "";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return [...map.entries()];
}

function MatchCard({
  match,
  visitorLogo,
  homeLogo,
}: {
  match: LeagueMatchEntry;
  visitorLogo?: string | null;
  homeLogo?: string | null;
}) {
  const played = Boolean(match.result?.replace(/\s/g, ""));

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-2 border-b border-border">
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 shrink-0 fill-none stroke-current"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 14 6 14s6-8.75 6-14c0-3.314-2.686-6-6-6z"
            />
            <circle cx={12} cy={8} r={2.5} />
          </svg>
          <span className="uppercase tracking-wide font-medium">
            {match.venue || "—"}
          </span>
        </span>
        <span
          className={`text-xs font-medium tracking-wide ${played ? "text-green-600" : "text-muted"}`}
        >
          {played ? "Joué" : "À venir"}
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center px-4 py-4 gap-2">
        {/* Visitor */}
        <div className="flex-1 flex items-center justify-end gap-3">
          <span className="font-semibold text-sm text-right">
            {match.visitor || "—"}
          </span>
          <TeamLogo url={visitorLogo} />
        </div>

        {/* Center */}
        <div className="flex flex-col items-center px-4 min-w-[80px]">
          <span className="font-bold text-xl tabular-nums">
            {played ? match.result : (match.time || "—")}
          </span>
          <span className="text-[10px] text-muted mt-0.5 text-center">
            {formatDateShort(match.date)}
          </span>
        </div>

        {/* Home */}
        <div className="flex-1 flex items-center gap-3">
          <TeamLogo url={homeLogo} />
          <span className="font-semibold text-sm">{match.home || "—"}</span>
        </div>
      </div>
    </div>
  );
}

function ScheduleSection({
  matches,
  logoByTeam,
}: {
  matches: LeagueMatchEntry[];
  logoByTeam: Map<string, string | null>;
}) {
  const grouped = useMemo(() => groupByDate(matches), [matches]);

  if (matches.length === 0) {
    return (
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Horaire</h3>
        <p className="text-sm text-muted">
          Aucun match. Synchronisez un fournisseur pour importer l'horaire.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h3 className="text-sm font-semibold">Horaire</h3>
      {grouped.map(([date, dayMatches]) => (
        <div key={date} className="space-y-2">
          <p className="text-xs font-bold tracking-widest text-muted">
            {formatDateHeader(date)}
          </p>
          {dayMatches.map((match, i) => (
            <MatchCard
              key={i}
              match={match}
              visitorLogo={logoByTeam.get(match.visitor)}
              homeLogo={logoByTeam.get(match.home)}
            />
          ))}
        </div>
      ))}
    </section>
  );
}

// ---- Main editor ----

export function LeagueDataEditor({
  projectId,
  initialData,
  source,
}: {
  projectId: string;
  initialData: UnifiedLeagueData;
  source: string;
}) {
  const [data, setData] = useState<UnifiedLeagueData>(initialData);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const logoByTeam = useMemo(
    () => new Map(data.standings.map((t) => [t.name, t.logo])),
    [data.standings],
  );

  // Accepts the data to persist directly — avoids relying on the React state
  // closure, which would capture stale values if called right after setState.
  const saveData = async (next: UnifiedLeagueData) => {
    setSaving(true);
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/projects/${projectId}/league-data`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: next, source: "manual" }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(
        (body as { error?: string }).error ?? "Enregistrement échoué.",
      );
      return;
    }
    setMessage("Enregistré.");
    setTimeout(() => setMessage(null), 3000);
  };

  // Logo upload: update state AND persist immediately so the URL survives a refresh.
  const onLeagueLogoUpload = (url: string) => {
    const next = { ...data, leagueLogo: url };
    setData(next);
    void saveData(next);
  };

  const onTeamLogoUpload = (teamIndex: number, url: string) => {
    const next = {
      ...data,
      standings: data.standings.map((t, j) =>
        j === teamIndex ? { ...t, logo: url } : t,
      ),
    };
    setData(next);
    void saveData(next);
  };

  const sourceLabel: Record<string, string> = {
    manual: "Manuel",
    planiligue: "Planiligue",
    spordle: "Spordle",
    matchify: "Matchify.ca",
  };

  return (
    <div className="space-y-8 max-w-3xl" data-project-id={projectId}>
      {/* Save bar */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => saveData(data)}
          disabled={saving}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {message && <p className="text-sm text-success">{message}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted ml-auto">
          Source :{" "}
          <span className="font-medium">{sourceLabel[source] ?? source}</span>
          {data._importedAt && (
            <>
              {" · Importé le "}
              {new Date(data._importedAt).toLocaleDateString("fr-CA", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </>
          )}
        </p>
      </div>

      {/* League info */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Informations de la ligue</h3>
        <div className="flex items-center gap-4">
          <LogoButton
            url={data.leagueLogo}
            size="lg"
            onUpload={onLeagueLogoUpload}
          />
          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-muted">Nom de la ligue</label>
              <input
                type="text"
                value={data.leagueName}
                onChange={(e) =>
                  setData((d) => ({ ...d, leagueName: e.target.value }))
                }
                placeholder="Ex. Ligue de Montréal"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted">Nom de la division</label>
              <input
                type="text"
                value={data.divisionName}
                onChange={(e) =>
                  setData((d) => ({ ...d, divisionName: e.target.value }))
                }
                placeholder="Ex. Division 1"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Standings — read-only + editable logos */}
      <StandingsSection
        teams={data.standings}
        onTeamLogoUpload={onTeamLogoUpload}
        onChange={(standings) => setData((d) => ({ ...d, standings }))}
      />

      <div className="border-t border-border" />

      {/* Schedule — read-only cards */}
      <ScheduleSection matches={data.schedule} logoByTeam={logoByTeam} />

    </div>
  );
}

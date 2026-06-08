"use client";

import { useMemo, useState } from "react";
import { pickLastMatch, pickNextMatch } from "@/lib/editor/league-prefill";
import type { DataRequirement } from "@/lib/types";
import type { LeagueMatchEntry, LeagueTeamEntry } from "@/lib/types-user";

export type DataSelections = Record<
  string,
  LeagueMatchEntry | LeagueMatchEntry[] | LeagueTeamEntry | null
>;

// ---- Helpers ----

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d
    .toLocaleDateString("fr-CA", { weekday: "short", day: "numeric", month: "short" })
    .toUpperCase();
}

// ---- Match filter tabs ----

type MatchFilter = "all" | "played" | "upcoming";

function isPlayed(match: LeagueMatchEntry): boolean {
  return Boolean(match.result?.match(/\d/));
}

function MatchFilterTabs({
  value,
  onChange,
}: {
  value: MatchFilter;
  onChange: (f: MatchFilter) => void;
}) {
  const tabs: { id: MatchFilter; label: string }[] = [
    { id: "all", label: "Tous" },
    { id: "played", label: "Joués" },
    { id: "upcoming", label: "À venir" },
  ];
  return (
    <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            value === tab.id
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ---- Match option card (radio ou checkbox) ----

function MatchOption({
  match,
  selected,
  onClick,
  multiple = false,
}: {
  match: LeagueMatchEntry;
  selected: boolean;
  onClick: () => void;
  multiple?: boolean;
}) {
  const played = Boolean(match.result?.match(/\d/));

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
        selected
          ? "border-accent bg-accent/5"
          : "border-border bg-surface hover:border-accent/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`mt-0.5 h-4 w-4 shrink-0 border-2 flex items-center justify-center ${
            multiple ? "rounded" : "rounded-full"
          } ${selected ? "border-accent" : "border-muted"}`}
        >
          {selected && (
            <span
              className={`h-2 w-2 bg-accent block ${multiple ? "rounded-sm" : "rounded-full"}`}
            />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted font-medium">
              {formatDate(match.date)}
            </span>
            {match.time && (
              <span className="text-xs text-muted">{match.time}</span>
            )}
            <span
              className={`ml-auto text-xs font-medium ${played ? "text-green-600" : "text-muted"}`}
            >
              {played ? "Joué" : "À venir"}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="font-semibold text-sm truncate">
              {match.visitor || "—"}
            </span>
            <span className="text-sm font-bold tabular-nums shrink-0">
              {played ? match.result : "–"}
            </span>
            <span className="font-semibold text-sm truncate text-right">
              {match.home || "—"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ---- Team option card ----

function TeamOption({
  team,
  position,
  selected,
  onClick,
}: {
  team: LeagueTeamEntry;
  position: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border px-4 py-3 transition-colors flex items-center gap-3 ${
        selected
          ? "border-accent bg-accent/5"
          : "border-border bg-surface hover:border-accent/50"
      }`}
    >
      <span
        className={`h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
          selected ? "border-accent" : "border-muted"
        }`}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-accent block" />}
      </span>
      {team.logo ? (
        <img
          src={team.logo}
          alt=""
          className="h-8 w-8 rounded-full object-contain border border-border shrink-0"
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-surface-2 border border-border shrink-0" />
      )}
      <span className="text-xs text-muted w-6 shrink-0">{position}</span>
      <span className="font-semibold text-sm flex-1 truncate">{team.name}</span>
      <span className="text-sm text-muted tabular-nums shrink-0">
        {team.pts ?? "—"} pts
      </span>
    </button>
  );
}

// ---- Auto requirement preview ----

function AutoPreview({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 px-4 py-3 space-y-1">
      <p className="text-xs text-muted font-medium">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

// ---- Main component ----

export function DataSelectionStep({
  requirements,
  schedule,
  standings,
  onConfirm,
}: {
  requirements: DataRequirement[];
  schedule: LeagueMatchEntry[];
  standings: LeagueTeamEntry[];
  onConfirm: (selections: DataSelections) => void;
}) {
  const [matchSelections, setMatchSelections] = useState<
    Record<string, LeagueMatchEntry | null>
  >({});
  const [teamSelections, setTeamSelections] = useState<
    Record<string, LeagueTeamEntry | null>
  >({});
  // results_pick : tableau de matchs par requirement id
  const [multiMatchSelections, setMultiMatchSelections] = useState<
    Record<string, LeagueMatchEntry[]>
  >({});
  const [matchFilters, setMatchFilters] = useState<Record<string, MatchFilter>>({});

  const getFilter = (req: DataRequirement): MatchFilter => {
    if (req.matchFilter && req.matchFilter !== "all") return req.matchFilter;
    return matchFilters[req.id] ?? "all";
  };
  const setFilter = (reqId: string, f: MatchFilter) =>
    setMatchFilters((prev) => ({ ...prev, [reqId]: f }));

  const applyFilter = (matches: LeagueMatchEntry[], filter: MatchFilter) => {
    if (filter === "played") return matches.filter(isPlayed);
    if (filter === "upcoming") return matches.filter((m) => !isPlayed(m));
    return matches;
  };

  const lastMatch = useMemo(() => pickLastMatch(schedule), [schedule]);
  const nextMatch = useMemo(() => pickNextMatch(schedule), [schedule]);

  const pickReqs = requirements.filter(
    (r) =>
      r.type === "match_pick" ||
      r.type === "team_pick" ||
      r.type === "results_pick",
  );

  const canConfirm = pickReqs.every((r) => {
    if (r.type === "match_pick") return Boolean(matchSelections[r.id]);
    if (r.type === "team_pick") return Boolean(teamSelections[r.id]);
    if (r.type === "results_pick")
      return (multiMatchSelections[r.id] ?? []).length > 0;
    return true;
  });

  const toggleMultiMatch = (
    reqId: string,
    match: LeagueMatchEntry,
    maxItems?: number,
  ) => {
    setMultiMatchSelections((prev) => {
      const current = prev[reqId] ?? [];
      const idx = current.indexOf(match);
      if (idx >= 0) {
        return { ...prev, [reqId]: current.filter((_, i) => i !== idx) };
      }
      if (maxItems !== undefined && current.length >= maxItems) return prev;
      return { ...prev, [reqId]: [...current, match] };
    });
  };

  const handleConfirm = () => {
    const selections: DataSelections = {
      ...matchSelections,
      ...teamSelections,
      ...multiMatchSelections,
    };
    for (const req of requirements) {
      if (req.type === "last_match" && lastMatch) selections[req.id] = lastMatch;
      if (req.type === "next_match" && nextMatch) selections[req.id] = nextMatch;
    }
    onConfirm(selections);
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Préparez vos données</h2>
        <p className="text-sm text-muted mt-1">
          Ce template utilise des données de votre ligue.
        </p>
      </div>

      <div className="space-y-6">
        {requirements.map((req) => {
          if (req.type === "match_pick") {
            const selected = matchSelections[req.id] ?? null;
            const filter = getFilter(req);
            const filtered = applyFilter(schedule, filter);
            const filterLocked = Boolean(req.matchFilter && req.matchFilter !== "all");
            return (
              <div key={req.id} className="space-y-2">
                <p className="text-sm font-medium">{req.label}</p>
                {schedule.length === 0 ? (
                  <p className="text-sm text-muted">
                    Aucun match dans l'horaire. Synchronisez d'abord vos données de ligue.
                  </p>
                ) : (
                  <>
                    {!filterLocked && (
                      <MatchFilterTabs value={filter} onChange={(f) => setFilter(req.id, f)} />
                    )}
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {filtered.length === 0 ? (
                        <p className="text-sm text-muted">Aucun match dans cette catégorie.</p>
                      ) : (
                        filtered.map((match, i) => (
                          <MatchOption
                            key={i}
                            match={match}
                            selected={selected === match}
                            onClick={() =>
                              setMatchSelections((s) => ({ ...s, [req.id]: match }))
                            }
                          />
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          }

          if (req.type === "results_pick") {
            const selected = multiMatchSelections[req.id] ?? [];
            const max = req.maxItems;
            const atMax = max !== undefined && selected.length >= max;
            const filter = getFilter(req);
            const filtered = applyFilter(schedule, filter);
            const filterLocked = Boolean(req.matchFilter && req.matchFilter !== "all");
            return (
              <div key={req.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{req.label}</p>
                  <span className="text-xs text-muted tabular-nums">
                    {selected.length}{max !== undefined ? `/${max}` : ""} sélectionné{selected.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {schedule.length === 0 ? (
                  <p className="text-sm text-muted">
                    Aucun match dans l'horaire. Synchronisez d'abord vos données de ligue.
                  </p>
                ) : (
                  <>
                    {!filterLocked && (
                      <MatchFilterTabs value={filter} onChange={(f) => setFilter(req.id, f)} />
                    )}
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {filtered.length === 0 ? (
                        <p className="text-sm text-muted">Aucun match dans cette catégorie.</p>
                      ) : (
                        filtered.map((match, i) => {
                          const isSelected = selected.includes(match);
                          const disabled = atMax && !isSelected;
                          return (
                            <div
                              key={i}
                              className={disabled ? "opacity-40 pointer-events-none" : ""}
                            >
                              <MatchOption
                                match={match}
                                selected={isSelected}
                                multiple
                                onClick={() => toggleMultiMatch(req.id, match, max)}
                              />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
                {atMax && (
                  <p className="text-xs text-muted">
                    Maximum atteint. Désélectionnez un match pour en choisir un autre.
                  </p>
                )}
              </div>
            );
          }

          if (req.type === "team_pick") {
            const selected = teamSelections[req.id] ?? null;
            return (
              <div key={req.id} className="space-y-2">
                <p className="text-sm font-medium">{req.label}</p>
                {standings.length === 0 ? (
                  <p className="text-sm text-muted">
                    Aucune équipe. Synchronisez d'abord vos données de ligue.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {standings.map((team, i) => (
                      <TeamOption
                        key={i}
                        team={team}
                        position={i + 1}
                        selected={selected === team}
                        onClick={() =>
                          setTeamSelections((s) => ({ ...s, [req.id]: team }))
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          }

          if (req.type === "last_match") {
            return (
              <div key={req.id} className="space-y-2">
                <p className="text-sm font-medium">{req.label}</p>
                {lastMatch ? (
                  <AutoPreview label="Sélectionné automatiquement">
                    <span className="font-medium">{lastMatch.visitor}</span>
                    {lastMatch.result && (
                      <span className="mx-2 text-muted">{lastMatch.result}</span>
                    )}
                    <span className="font-medium">{lastMatch.home}</span>
                    {lastMatch.date && (
                      <span className="ml-2 text-muted text-xs">
                        {formatDate(lastMatch.date)}
                      </span>
                    )}
                  </AutoPreview>
                ) : (
                  <p className="text-sm text-muted">Aucun match joué trouvé.</p>
                )}
              </div>
            );
          }

          if (req.type === "next_match") {
            return (
              <div key={req.id} className="space-y-2">
                <p className="text-sm font-medium">{req.label}</p>
                {nextMatch ? (
                  <AutoPreview label="Sélectionné automatiquement">
                    <span className="font-medium">{nextMatch.visitor}</span>
                    <span className="mx-2 text-muted">vs</span>
                    <span className="font-medium">{nextMatch.home}</span>
                    {nextMatch.date && (
                      <span className="ml-2 text-muted text-xs">
                        {formatDate(nextMatch.date)}
                        {nextMatch.time && ` ${nextMatch.time}`}
                      </span>
                    )}
                  </AutoPreview>
                ) : (
                  <p className="text-sm text-muted">Aucun match à venir trouvé.</p>
                )}
              </div>
            );
          }

          if (req.type === "standings") {
            return (
              <div key={req.id} className="space-y-2">
                <p className="text-sm font-medium">{req.label}</p>
                <AutoPreview label="Sélectionné automatiquement">
                  {standings.length > 0
                    ? `${standings.length} équipes · ${standings[0]?.name} en tête`
                    : "Aucun classement disponible."}
                </AutoPreview>
              </div>
            );
          }

          return null;
        })}
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!canConfirm}
        className="rounded-2xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-40"
      >
        Générer le visuel →
      </button>
    </div>
  );
}

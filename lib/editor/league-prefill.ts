import type {
  FieldDataSource,
  FieldValues,
  JsonConfig,
  ListField,
  ListItem,
  ListSubfield,
  MatchSubfieldSource,
} from "@/lib/types";
import type { PlaniligueMatch } from "@/lib/planiligue-types";
import type { LeagueMatchEntry, LeagueTeamEntry } from "@/lib/types-user";

// ─── Internal helpers ─────────────────────────────────────────────────────────

function parseScore(result: string): { dom: string; ext: string } | null {
  const m = result.match(/(\d+)\s*[-–]\s*(\d+)/);
  return m ? { dom: m[1], ext: m[2] } : null;
}

function pickLastPlayedMatch(
  schedule: unknown,
): Record<string, unknown> | undefined {
  if (!Array.isArray(schedule)) return undefined;
  const played = (schedule as PlaniligueMatch[]).filter(
    (m) => m.result && /\d/.test(m.result),
  );
  if (!played.length) return undefined;
  const last = played[played.length - 1];
  const scoreMatch = last.result?.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (!scoreMatch) return undefined;
  return {
    equipe_dom: last.visitor?.replace(/^\*\s*/, "") ?? "",
    equipe_ext: last.home ?? "",
    score_dom: scoreMatch[1],
    score_ext: scoreMatch[2],
    date: last.date
      ? `${last.date}${last.time ? ` ${last.time}` : ""}`.trim()
      : undefined,
  };
}

// ─── DataSelections ───────────────────────────────────────────────────────────

/**
 * Sélections de l'utilisateur dans DataSelectionStep.
 * - match_pick / last_match / next_match → LeagueMatchEntry
 * - results_pick → LeagueMatchEntry[]
 * - team_pick → LeagueTeamEntry
 */
export type DataSelections = Record<
  string,
  LeagueMatchEntry | LeagueMatchEntry[] | LeagueTeamEntry | null
>;

function isMatch(v: LeagueMatchEntry | LeagueMatchEntry[] | LeagueTeamEntry): v is LeagueMatchEntry {
  return !Array.isArray(v) && "home" in v && "visitor" in v;
}

function isMatchArray(v: LeagueMatchEntry | LeagueMatchEntry[] | LeagueTeamEntry): v is LeagueMatchEntry[] {
  return Array.isArray(v);
}

function isTeam(v: LeagueMatchEntry | LeagueMatchEntry[] | LeagueTeamEntry): v is LeagueTeamEntry {
  return !Array.isArray(v) && "name" in v && !("home" in v);
}

// ─── Subfield resolution ──────────────────────────────────────────────────────

function resolveMatchSubfield(
  src: MatchSubfieldSource,
  match: LeagueMatchEntry,
): string {
  switch (src) {
    case "match.home":           return match.home;
    case "match.visitor":        return match.visitor;
    case "match.date":           return match.date;
    case "match.time":           return match.time;
    case "match.result":         return match.result;
    case "match.score_home": {
      const s = parseScore(match.result);
      return s?.ext ?? "";
    }
    case "match.score_visitor": {
      const s = parseScore(match.result);
      return s?.dom ?? "";
    }
  }
}

/** Convention sans dataSource explicite : le nom de clé mappe directement. */
function resolveMatchByConvention(key: string, match: LeagueMatchEntry): string {
  switch (key) {
    case "home":       return match.home;
    case "visitor":    return match.visitor;
    case "date":       return match.date;
    case "time":       return match.time;
    case "result":     return match.result;
    case "equipe_dom": return match.visitor; // convention : visitor = dom
    case "equipe_ext": return match.home;
    case "score_dom": {
      const s = parseScore(match.result);
      return s?.dom ?? "";
    }
    case "score_ext": {
      const s = parseScore(match.result);
      return s?.ext ?? "";
    }
    default: return "";
  }
}

function matchToListItem(
  match: LeagueMatchEntry,
  subfields: ListSubfield[],
): ListItem {
  const item: ListItem = {};
  for (const sub of subfields) {
    const value = sub.dataSource
      ? resolveMatchSubfield(sub.dataSource, match)
      : resolveMatchByConvention(sub.key, match);
    if (value !== "") item[sub.key] = value;
  }
  return item;
}

// ─── List field resolver ──────────────────────────────────────────────────────

function resolveListDataSource(
  source: FieldDataSource,
  field: ListField,
  selections: DataSelections,
  schedule: LeagueMatchEntry[],
): ListItem[] | null {
  const max = field.maxItems;

  // results_pick : l'utilisateur a sélectionné plusieurs matchs
  if (field.requirementId) {
    const sel = selections[field.requirementId];
    if (sel && isMatchArray(sel)) {
      return sel
        .slice(0, max)
        .map((m) => matchToListItem(m, field.subfields));
    }
  }

  if (source === "schedule.results") {
    const played = schedule.filter((m) => m.result && /\d/.test(m.result));
    return played
      .slice(-max)
      .map((m) => matchToListItem(m, field.subfields));
  }

  if (source === "schedule.upcoming") {
    const upcoming = schedule.filter((m) => !m.result?.match(/\d/));
    return upcoming
      .slice(0, max)
      .map((m) => matchToListItem(m, field.subfields));
  }

  return null;
}

// ─── Scalar dataSource resolver ───────────────────────────────────────────────

function resolveScalarDataSource(
  source: FieldDataSource,
  requirementId: string | undefined,
  selections: DataSelections,
  logoByTeam: Map<string, string | null>,
  standings: LeagueTeamEntry[],
  leagueData: Record<string, unknown>,
): string | null {
  let sel: LeagueMatchEntry | LeagueTeamEntry | null = null;
  if (requirementId) {
    const raw = selections[requirementId] ?? null;
    // Ignore les sélections multi (results_pick) pour les champs scalaires
    sel = raw === null || isMatchArray(raw) ? null : raw;
  } else {
    const all = Object.values(selections).filter(Boolean).filter(
      (v): v is LeagueMatchEntry | LeagueTeamEntry => !isMatchArray(v!),
    );
    if (
      source.startsWith("match.") ||
      source === "standings.json" ||
      source === "schedule.results" ||
      source === "schedule.upcoming"
    ) {
      sel = all.find(isMatch) ?? null;
    } else if (source.startsWith("team.")) {
      sel = all.find(isTeam) ?? null;
    }
  }

  const match = sel && isMatch(sel) ? sel : null;
  const team = sel && isTeam(sel) ? sel : null;

  switch (source) {
    // ── Match ──
    case "match.home":         return match?.home ?? null;
    case "match.visitor":      return match?.visitor ?? null;
    case "match.date":         return match?.date ?? null;
    case "match.time":         return match?.time ?? null;
    case "match.result":       return match?.result ?? null;
    case "match.home_logo":    return logoByTeam.get(match?.home ?? "") ?? null;
    case "match.visitor_logo": return logoByTeam.get(match?.visitor ?? "") ?? null;
    case "match.score_home": {
      const s = match?.result ? parseScore(match.result) : null;
      return s?.ext ?? null;
    }
    case "match.score_visitor": {
      const s = match?.result ? parseScore(match.result) : null;
      return s?.dom ?? null;
    }
    // ── Équipe ──
    case "team.name":     return team?.name ?? null;
    case "team.logo":     return team?.logo ?? null;
    case "team.pts":      return team?.pts?.toString() ?? null;
    case "team.pj":       return team?.pj?.toString() ?? null;
    case "team.v":        return team?.v?.toString() ?? null;
    case "team.n":        return team?.n?.toString() ?? null;
    case "team.d":        return team?.d?.toString() ?? null;
    case "team.bp":       return team?.bp?.toString() ?? null;
    case "team.bc":       return team?.bc?.toString() ?? null;
    case "team.position": {
      if (!team) return null;
      const pos = standings.indexOf(team) + 1;
      return pos > 0 ? String(pos) : null;
    }
    // ── Ligue ──
    case "league.name":     return (leagueData.leagueName as string) ?? null;
    case "league.division": return (leagueData.divisionName as string) ?? null;
    case "league.logo":     return (leagueData.leagueLogo as string) ?? null;
    // ── Classement ──
    case "standings.json": return standings.length ? JSON.stringify(standings) : null;
    // ── Listes (non applicables aux champs scalaires) ──
    case "schedule.results":
    case "schedule.upcoming":
      return null;
  }
}

/**
 * Résout les valeurs de tous les champs qui ont un `dataSource` explicite.
 * Gère à la fois les champs scalaires et les champs list (schedule.results /
 * schedule.upcoming / results_pick).
 */
export function resolveFieldValuesFromSelections(
  config: JsonConfig,
  selections: DataSelections,
  logoByTeam: Map<string, string | null>,
  standings: LeagueTeamEntry[],
  leagueData: Record<string, unknown>,
): FieldValues {
  const schedule = Array.isArray(leagueData.schedule)
    ? (leagueData.schedule as LeagueMatchEntry[])
    : [];

  const next: FieldValues = {};
  for (const field of config.fields) {
    if (field.type === "shape" || !field.dataSource) continue;

    if (field.type === "list") {
      const items = resolveListDataSource(
        field.dataSource as FieldDataSource,
        field as ListField,
        selections,
        schedule,
      );
      if (items && items.length > 0) next[field.key] = items;
    } else {
      const value = resolveScalarDataSource(
        field.dataSource as FieldDataSource,
        field.requirementId,
        selections,
        logoByTeam,
        standings,
        leagueData,
      );
      if (value !== null && value !== "") next[field.key] = value;
    }
  }
  return next;
}

// ─── HTML template data builder ──────────────────────────────────────────────

function formatMatchDay(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long" });
}

function matchToHtmlObject(
  match: LeagueMatchEntry,
  logoByTeam: Map<string, string | null>,
): Record<string, unknown> {
  const scores = parseScore(match.result);
  return {
    home: match.home,
    visitor: match.visitor,
    result: match.result,
    date: match.date,
    time: match.time,
    day: formatMatchDay(match.date),
    score_home: scores?.ext ?? "",
    score_visitor: scores?.dom ?? "",
    home_logo: logoByTeam.get(match.home) ?? "",
    visitor_logo: logoByTeam.get(match.visitor) ?? "",
  };
}

function teamToHtmlObject(
  team: LeagueTeamEntry,
  position: number,
): Record<string, unknown> {
  return {
    name: team.name,
    logo: team.logo ?? "",
    pts: team.pts ?? 0,
    pj: team.pj ?? 0,
    v: team.v ?? 0,
    n: team.n ?? 0,
    d: team.d ?? 0,
    bp: team.bp ?? 0,
    bc: team.bc ?? 0,
    diff: team.diff ?? 0,
    position,
  };
}

/**
 * Construit les données supplémentaires à injecter dans window.TEMPLATE_DATA
 * pour un template HTML, à partir des sélections de l'utilisateur.
 *
 * Chaque requirement produit une clé dans l'objet retourné, identifiée par
 * son `id`. Ex: requirement { id: "match", type: "match_pick" } → { match: { home, visitor, … } }
 */
export function buildHtmlDataFromSelections(
  requirements: import("@/lib/types").DataRequirement[],
  selections: DataSelections,
  standings: LeagueTeamEntry[],
  schedule: LeagueMatchEntry[],
  leagueData?: Record<string, unknown>,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const logoByTeam = new Map(standings.map((t) => [t.name, t.logo ?? null]));

  for (const req of requirements) {
    if (req.type === "last_match") {
      const match = pickLastMatch(schedule);
      if (match) data[req.id] = matchToHtmlObject(match, logoByTeam);
    } else if (req.type === "next_match") {
      const match = pickNextMatch(schedule);
      if (match) data[req.id] = matchToHtmlObject(match, logoByTeam);
    } else if (req.type === "match_pick") {
      const sel = selections[req.id];
      if (sel && !isMatchArray(sel) && isMatch(sel)) {
        data[req.id] = matchToHtmlObject(sel, logoByTeam);
      }
    } else if (req.type === "results_pick") {
      const sel = selections[req.id];
      if (sel && isMatchArray(sel)) {
        data[req.id] = sel.map((m) => matchToHtmlObject(m, logoByTeam));
      }
    } else if (req.type === "team_pick") {
      const sel = selections[req.id];
      if (sel && !isMatchArray(sel) && isTeam(sel)) {
        data[req.id] = teamToHtmlObject(sel, standings.indexOf(sel) + 1);
      }
    } else if (req.type === "standings") {
      data[req.id] = standings.map((t, i) => teamToHtmlObject(t, i + 1));
    } else if (req.type === "league") {
      data[req.id] = {
        name:     (leagueData?.leagueName as string)   ?? "",
        logo:     (leagueData?.leagueLogo as string)   ?? "",
        division: (leagueData?.divisionName as string) ?? "",
      };
    }
  }

  return data;
}

// ─── Convenience helpers for DataSelectionStep ───────────────────────────────

/** Retourne le dernier match joué depuis le schedule unifié. */
export function pickLastMatch(
  schedule: LeagueMatchEntry[],
): LeagueMatchEntry | undefined {
  const played = schedule.filter((m) => m.result?.match(/\d/));
  return played.length ? played[played.length - 1] : undefined;
}

/** Retourne le prochain match non joué. */
export function pickNextMatch(
  schedule: LeagueMatchEntry[],
): LeagueMatchEntry | undefined {
  return schedule.find((m) => !m.result?.match(/\d/));
}

// ─── Convention-based mapping (backward compat) ───────────────────────────────

export function matchToFieldValues(
  match: LeagueMatchEntry,
  logoByTeam: Map<string, string | null>,
  config: JsonConfig,
): FieldValues {
  const keys = new Set(config.fields.map((f) => f.key));
  const next: FieldValues = {};
  const setIf = (key: string, value: unknown) => {
    if (!keys.has(key) || value == null) return;
    if (typeof value === "string" && value === "") return;
    next[key] = String(value);
  };
  setIf("equipe_dom", match.visitor);
  setIf("equipe_ext", match.home);
  setIf("logo_dom", logoByTeam.get(match.visitor));
  setIf("logo_ext", logoByTeam.get(match.home));
  setIf("date", match.date ? `${match.date}${match.time ? ` ${match.time}` : ""}` : "");
  const scores = match.result ? parseScore(match.result) : null;
  if (scores) {
    setIf("score_dom", scores.dom);
    setIf("score_ext", scores.ext);
  }
  return next;
}

export function teamToFieldValues(
  team: LeagueTeamEntry,
  position: number,
  config: JsonConfig,
): FieldValues {
  const keys = new Set(config.fields.map((f) => f.key));
  const next: FieldValues = {};
  const setIf = (key: string, value: unknown) => {
    if (!keys.has(key) || value == null) return;
    if (typeof value === "string" && value === "") return;
    next[key] = String(value);
  };
  setIf("equipe", team.name);
  setIf("equipe_dom", team.name);
  setIf("logo", team.logo);
  setIf("logo_dom", team.logo);
  setIf("position", position);
  setIf("pts", team.pts);
  setIf("pj", team.pj);
  setIf("v", team.v);
  setIf("n", team.n);
  setIf("d", team.d);
  setIf("bp", team.bp);
  setIf("bc", team.bc);
  return next;
}

// ─── Main prefill entry point ─────────────────────────────────────────────────

/** Applique les données de ligue aux champs du template au chargement. */
export function leagueDataToFieldValues(
  data: Record<string, unknown>,
  config: JsonConfig,
): FieldValues {
  const keys = new Set(config.fields.map((f) => f.key));
  const next: FieldValues = {};

  const setIf = (key: string, value: unknown) => {
    if (!keys.has(key) || value === undefined || value === null) return;
    if (typeof value === "string" && value === "") return;
    next[key] = String(value);
  };

  // ── Convention-based fallback ──
  setIf("equipe_dom", data.equipe_dom);
  setIf("equipe_ext", data.equipe_ext);
  setIf("score_dom", data.score_dom);
  setIf("score_ext", data.score_ext);
  setIf("logo_dom", data.logo_dom);
  setIf("logo_ext", data.logo_ext);
  setIf("date", data.date);

  const lastMatch =
    (data.lastMatch && typeof data.lastMatch === "object"
      ? (data.lastMatch as Record<string, unknown>)
      : undefined) ?? pickLastPlayedMatch(data.schedule);

  if (lastMatch) {
    setIf("equipe_dom", lastMatch.equipe_dom);
    setIf("equipe_ext", lastMatch.equipe_ext);
    setIf("score_dom", lastMatch.score_dom);
    setIf("score_ext", lastMatch.score_ext);
    setIf("date", lastMatch.date);
    if (keys.has("buteurs") && Array.isArray(lastMatch.buteurs)) {
      next.buteurs = lastMatch.buteurs as FieldValues["buteurs"];
    }
  }

  if (keys.has("buteurs") && Array.isArray(data.buteurs)) {
    next.buteurs = data.buteurs as FieldValues["buteurs"];
  }

  if (keys.has("classement") && data.standings) {
    next.classement = JSON.stringify(data.standings);
  }

  if (keys.has("equipes") && Array.isArray(data.teams)) {
    next.equipes = (data.teams as { name: string }[]).map((t) => t.name).join(", ");
  }

  // ── dataSource : résolution auto des requirements non-interactifs ──
  const requirements = config.requirements ?? [];
  const autoTypes = new Set(["last_match", "next_match", "standings", "league"]);

  // Un champ list avec schedule.results / schedule.upcoming est aussi auto
  const hasAutoDataSources = config.fields.some((f) => {
    if (!f.dataSource) return false;
    if (f.dataSource === "schedule.results" || f.dataSource === "schedule.upcoming") return true;
    return !f.requirementId || autoTypes.has(
      requirements.find((r) => r.id === f.requirementId)?.type ?? "",
    );
  });

  if (hasAutoDataSources) {
    const standings = Array.isArray(data.standings)
      ? (data.standings as LeagueTeamEntry[])
      : [];
    const schedule = Array.isArray(data.schedule)
      ? (data.schedule as LeagueMatchEntry[])
      : [];
    const logoByTeam = new Map(standings.map((t) => [t.name, t.logo]));

    const autoSelections: DataSelections = {};
    for (const req of requirements) {
      if (req.type === "last_match") {
        autoSelections[req.id] = pickLastMatch(schedule) ?? null;
      } else if (req.type === "next_match") {
        autoSelections[req.id] = pickNextMatch(schedule) ?? null;
      }
    }

    const dataSourceValues = resolveFieldValuesFromSelections(
      config,
      autoSelections,
      logoByTeam,
      standings,
      data,
    );
    return { ...next, ...dataSourceValues };
  }

  return next;
}

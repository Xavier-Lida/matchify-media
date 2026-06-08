import type {
  UnifiedLeagueData,
  LeagueTeamEntry,
  LeagueMatchEntry,
} from "./types-user";
import type { PlaniligueTournamentData } from "./planiligue-types";

export function emptyLeagueData(): UnifiedLeagueData {
  return { leagueName: "", divisionName: "", leagueLogo: null, standings: [], schedule: [] };
}

export function emptyTeam(): LeagueTeamEntry {
  return {
    name: "",
    logo: null,
    pj: null,
    v: null,
    n: null,
    d: null,
    bp: null,
    bc: null,
    diff: null,
    pts: null,
  };
}

export function emptyMatch(): LeagueMatchEntry {
  return { date: "", time: "", home: "", visitor: "", result: "", venue: "" };
}

export function fromPlaniligue(
  data: PlaniligueTournamentData,
): UnifiedLeagueData {
  const standings: LeagueTeamEntry[] = [];
  // Division name comes from the first (and usually only) division entry
  const divisionName = data.standings[0]?.name ?? "";

  for (const division of data.standings) {
    for (const group of division.groups) {
      for (const row of group.rows) {
        standings.push({
          name: row.team,
          logo: null,
          pj: row.pj,
          v: row.v,
          n: row.n,
          d: row.d,
          bp: row.bp,
          bc: row.bc,
          diff: row.diff,
          pts: row.pts,
        });
      }
    }
  }

  const schedule: LeagueMatchEntry[] = data.schedule.map((m) => ({
    date: m.date ?? "",
    time: m.time ?? "",
    home: m.home,
    visitor: m.visitor,
    result: m.result ?? "",
    venue: m.venue ?? "",
  }));

  return {
    leagueName: data.tournamentName ?? "",
    divisionName,
    leagueLogo: null,
    standings,
    schedule,
    _provider: "planiligue",
    _importedAt: data.importedAt,
    _sourceUrl: data.sourceUrl,
  };
}

export function fromRaw(raw: Record<string, unknown>): UnifiedLeagueData {
  if (!raw || Object.keys(raw).length === 0) {
    return emptyLeagueData();
  }

  // Unified format
  if (typeof raw.leagueName === "string" && Array.isArray(raw.standings)) {
    return {
      leagueName: raw.leagueName,
      divisionName: typeof raw.divisionName === "string" ? raw.divisionName : "",
      leagueLogo: (raw.leagueLogo as string | null) ?? null,
      standings: raw.standings as LeagueTeamEntry[],
      schedule: Array.isArray(raw.schedule)
        ? (raw.schedule as LeagueMatchEntry[])
        : [],
      _provider: raw._provider as string | undefined,
      _importedAt: raw._importedAt as string | undefined,
      _sourceUrl: raw._sourceUrl as string | undefined,
    };
  }

  // Old Planiligue format
  if (raw.provider === "planiligue") {
    return fromPlaniligue(raw as unknown as PlaniligueTournamentData);
  }

  return emptyLeagueData();
}

export function mergeWithProvider(
  existing: UnifiedLeagueData,
  incoming: UnifiedLeagueData,
): UnifiedLeagueData {
  const logoMap = new Map<string, string | null>();
  for (const team of existing.standings) {
    logoMap.set(team.name.toLowerCase().trim(), team.logo);
  }

  const mergedStandings = incoming.standings.map((team) => ({
    ...team,
    logo: logoMap.get(team.name.toLowerCase().trim()) ?? team.logo,
  }));

  return {
    leagueName: existing.leagueName || incoming.leagueName,
    divisionName: existing.divisionName || incoming.divisionName,
    leagueLogo: existing.leagueLogo,
    standings: mergedStandings,
    schedule: incoming.schedule,
    _provider: incoming._provider,
    _importedAt: incoming._importedAt,
    _sourceUrl: incoming._sourceUrl,
  };
}

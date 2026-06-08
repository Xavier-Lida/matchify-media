import "server-only";

import * as cheerio from "cheerio";
import type {
  ParsedPlaniligueUrl,
  PlaniligueMatch,
  PlaniligueStandingDivision,
  PlaniligueStandingGroup,
  PlaniligueStandingRow,
  PlaniligueTeam,
  PlaniligueTournamentData,
} from "@/lib/planiligue-types";

/**
 * Scraping Planiligue — pas d’API publique.
 * Sélecteurs calibrés sur pages publiques (2025–2026) ; susceptibles de changer.
 */

const PLANILIGUE_HOSTS = new Set(["planiligue.com", "www.planiligue.com"]);
const FETCH_HEADERS = { "User-Agent": "Mozilla/5.0 (MatchifyMedia/1.0)" };
const MAX_DIVISION_FETCHES = 20;

export function isValidPlaniligueUrl(raw: string): boolean {
  try {
    const host = new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
    return PLANILIGUE_HOSTS.has(host) || host.endsWith(".planiligue.com");
  } catch {
    return false;
  }
}

function cleanText(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function parseIntOrNull(text: string): number | null {
  const n = Number(text.replace(/[^\d-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function extractTournamentId(url: URL): number | null {
  const fromQuery = url.searchParams.get("tournament_id");
  if (fromQuery) {
    const id = Number(fromQuery);
    if (Number.isFinite(id) && id > 0) return id;
  }
  const slugMatch = url.pathname.match(/-(\d+)\.html$/);
  if (slugMatch) return Number(slugMatch[1]);
  return null;
}

export function parsePlaniligueUrl(raw: string): ParsedPlaniligueUrl {
  if (!isValidPlaniligueUrl(raw)) {
    throw new Error("URL Planiligue invalide.");
  }
  const url = new URL(raw);
  const tournamentId = extractTournamentId(url);
  if (!tournamentId) {
    throw new Error("ID de tournoi introuvable dans l’URL.");
  }

  const sportMatch = url.pathname.match(/\/tournois\/([^/]+)\//);
  const slugMatch = url.pathname.match(/\/([^/]+)-(\d+)\.html$/);
  const filterDivision = url.searchParams.get("filter_division") ?? undefined;

  return {
    sourceUrl: url.toString(),
    tournamentId,
    filterDivision,
    sport: sportMatch?.[1],
    slug: slugMatch?.[1],
  };
}

export function standingPageUrl(
  tournamentId: number,
  filterDivision?: string,
): string {
  let url = `https://www.planiligue.com/tournament_public_standing.php?tournament_id=${tournamentId}&lang=fr`;
  if (filterDivision) url += `&filter_division=${filterDivision}`;
  return url;
}

function schedulePageUrl(tournamentId: number, filterDivision?: string): string {
  let url = `https://www.planiligue.com/tournament_public.php?tournament_id=${tournamentId}`;
  if (filterDivision) url += `&filter_division=${filterDivision}`;
  return url;
}

function deriveSeoUrls(parsed: ParsedPlaniligueUrl): {
  teamsUrl?: string;
  scheduleUrl?: string;
} {
  const { tournamentId, sport, slug, sourceUrl } = parsed;
  const url = new URL(sourceUrl);
  const path = url.pathname;

  if (/\/equipes\//.test(path)) {
    return {
      teamsUrl: sourceUrl,
      scheduleUrl: sourceUrl.replace("/equipes/", "/horaire/"),
    };
  }
  if (/\/horaire\//.test(path)) {
    return {
      scheduleUrl: sourceUrl,
      teamsUrl: sourceUrl.replace("/horaire/", "/equipes/"),
    };
  }
  if (/\/statistiques\//.test(path)) {
    const base = path.replace("/statistiques/", "/equipes/");
    return {
      teamsUrl: `https://www.planiligue.com${base}`,
      scheduleUrl: `https://www.planiligue.com${path.replace("/statistiques/", "/horaire/")}`,
    };
  }

  if (sport && slug) {
    const base = `/tournois/${sport}/canada/quebec`;
    return {
      teamsUrl: `https://www.planiligue.com${base}/equipes/${slug}-${tournamentId}.html`,
      scheduleUrl: `https://www.planiligue.com${base}/horaire/${slug}-${tournamentId}.html`,
    };
  }

  return {};
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: FETCH_HEADERS, redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Planiligue a répondu ${res.status} pour ${url}`);
  }
  return res.text();
}

function discoverNavUrls(html: string, baseUrl: string): {
  teamsUrl?: string;
  scheduleUrl?: string;
  tournamentName?: string;
} {
  const $ = cheerio.load(html);
  let teamsUrl: string | undefined;
  let scheduleUrl: string | undefined;

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const text = cleanText($(el).text()).toLowerCase();
    let absolute: string;
    try {
      absolute = new URL(href, baseUrl).toString();
    } catch {
      return;
    }
    if (!teamsUrl && /\/equipes\//.test(absolute)) {
      teamsUrl = absolute;
    }
    if (
      !scheduleUrl &&
      /\/horaire\//.test(absolute) &&
      (text.includes("horaire") || text === "")
    ) {
      scheduleUrl = absolute;
    }
  });

  const tournamentName = cleanText($("h3").first().text()) || undefined;

  return { teamsUrl, scheduleUrl, tournamentName };
}

function parseStandingTable(
  $: cheerio.CheerioAPI,
  table: Parameters<cheerio.CheerioAPI>[0],
): PlaniligueStandingRow[] {
  const rows: PlaniligueStandingRow[] = [];
  const $table = $(table);

  // Build column → index map from <thead> to handle extra columns (e.g. FTE).
  const colIndex: Record<string, number> = {};
  $table.find("thead tr th").each((idx, th) => {
    colIndex[cleanText($(th).text()).toLowerCase()] = idx;
  });

  const ci = {
    pj:   colIndex["pj"]   ?? 2,
    v:    colIndex["v"]    ?? 3,
    n:    colIndex["n"]    ?? 4,
    d:    colIndex["d"]    ?? 5,
    bp:   colIndex["bp"]   ?? 6,
    bc:   colIndex["bc"]   ?? 7,
    diff: colIndex["+/-"]  ?? colIndex["diff"] ?? 9,
    pts:  colIndex["pts"]  ?? 10,
  };

  $table.find("tbody tr[name='game_row'], tbody tr").each((_, tr) => {
    const cells = $(tr)
      .find("td")
      .map((__, td) => cleanText($(td).text()))
      .get();
    if (cells.length < 4) return;

    const teamCell = $(tr).find("td").eq(1);
    const team =
      cleanText(teamCell.find("[title]").attr("title")) ||
      cleanText(teamCell.find("div").first().text()) ||
      cells[1];
    if (!team) return;

    const pick = (idx: number) =>
      idx < cells.length ? parseIntOrNull(cells[idx]) : null;

    rows.push({
      position: parseIntOrNull(cells[0]) ?? rows.length + 1,
      team,
      pj:   pick(ci.pj),
      v:    pick(ci.v),
      n:    pick(ci.n),
      d:    pick(ci.d),
      bp:   pick(ci.bp),
      bc:   pick(ci.bc),
      diff: pick(ci.diff),
      pts:  pick(ci.pts),
    });
  });

  return rows;
}

function parseGroupsFromCheerio(
  $: cheerio.CheerioAPI,
): PlaniligueStandingGroup[] {
  const groups: PlaniligueStandingGroup[] = [];

  $("#tabs-1 table.table-bordered").each((_, table) => {
    const groupName =
      cleanText($(table).prev("div").find("b").first().text()) || "Classement";
    const rows = parseStandingTable($, table);
    if (rows.length) groups.push({ name: groupName, rows });
  });

  if (groups.length === 0) {
    $("table.table-bordered").each((_, table) => {
      const header = cleanText($(table).find("th").first().text());
      if (!header.toLowerCase().includes("pos")) return;
      const rows = parseStandingTable($, table);
      if (rows.length) groups.push({ name: "Classement", rows });
    });
  }

  return groups;
}

export async function scrapeStandings(
  standingUrl: string,
): Promise<{ divisions: PlaniligueStandingDivision[]; tournamentName?: string }> {
  const html = await fetchHtml(standingUrl);
  const $ = cheerio.load(html);
  const tournamentName = cleanText($("h3").first().text()) || undefined;

  // If a specific division is already selected in the URL, parse only that page.
  const preselectedDivision = new URL(standingUrl).searchParams.get("filter_division");
  if (preselectedDivision) {
    const divisionName =
      cleanText($(`#filter_division option[value="${preselectedDivision}"]`).text()) ||
      tournamentName ||
      "Classement";
    const groups = parseGroupsFromCheerio($);
    return {
      divisions: groups.length
        ? [{ name: divisionName, divisionId: preselectedDivision, groups }]
        : [],
      tournamentName,
    };
  }

  const divisionOptions: { id: string; name: string }[] = [];
  $("#filter_division option").each((_, opt) => {
    const id = $(opt).attr("value");
    const name = cleanText($(opt).text());
    if (id && name) divisionOptions.push({ id, name });
  });

  const divisionIds =
    divisionOptions.length > 0
      ? divisionOptions.slice(0, MAX_DIVISION_FETCHES)
      : [{ id: "", name: tournamentName ?? "Classement" }];

  const divisions: PlaniligueStandingDivision[] = [];

  for (const div of divisionIds) {
    const tid = new URL(standingUrl).searchParams.get("tournament_id");
    const url =
      div.id && tid
        ? `https://www.planiligue.com/tournament_public_standing.php?tournament_id=${tid}&lang=fr&filter_division=${div.id}`
        : standingUrl;

    const divHtml =
      div.id && divisionIds.length > 1 ? await fetchHtml(url) : html;
    const $div = cheerio.load(divHtml);
    const groups = parseGroupsFromCheerio($div);

    if (groups.length) {
      divisions.push({
        name: div.name,
        divisionId: div.id || undefined,
        groups,
      });
    }
  }

  return { divisions, tournamentName };
}

export async function scrapeTeams(teamsUrl: string): Promise<{
  teams: PlaniligueTeam[];
  tournamentName?: string;
}> {
  const html = await fetchHtml(teamsUrl);
  const $ = cheerio.load(html);
  const tournamentName = cleanText($("h3").first().text()) || undefined;
  const teams: PlaniligueTeam[] = [];

  $(".row.team_accepted").each((_, row) => {
    const name =
      cleanText($(row).find(".team .long_string").attr("title")) ||
      cleanText($(row).find(".team .long_string").first().text());
    if (!name) return;

    teams.push({
      name,
      club: cleanText($(row).find(".club .long_string").attr("title")) || undefined,
      category:
        cleanText($(row).find(".category .long_string").attr("title")) ||
        cleanText($(row).find(".category .long_string").first().text()) ||
        undefined,
      class:
        cleanText($(row).find(".class .long_string").attr("title")) ||
        cleanText($(row).find(".class .long_string").first().text()) ||
        undefined,
      gender: cleanText($(row).find(".gender .long_string").first().text()) || undefined,
    });
  });

  return { teams, tournamentName };
}

function parseMatchRow(
  $: cheerio.CheerioAPI,
  row: Parameters<cheerio.CheerioAPI>[0],
): PlaniligueMatch | null {
  const $row = $(row);
  const visitor =
    cleanText($row.find(".away .long_string").attr("title")) ||
    cleanText($row.find(".away a span").last().text()) ||
    cleanText($row.find(".away").text());
  const home =
    cleanText($row.find(".home .long_string").attr("title")) ||
    cleanText($row.find(".home a span").last().text()) ||
    cleanText($row.find(".home").text());

  if (!visitor && !home) return null;

  const result = cleanText($row.find(".result").text());
  const date =
    cleanText($row.find(".date-tournament .zoom-field").attr("title"))?.replace(
      /^Afficher les matchs du\s*/i,
      "",
    ) || cleanText($row.find(".date-tournament").text());

  return {
    matchNo: cleanText($row.find(".match-no").text()) || undefined,
    day: cleanText($row.find(".day").text()) || undefined,
    date: date || undefined,
    time: cleanText($row.find(".hour").text()) || undefined,
    visitor: visitor.replace(/^\*\s*/, ""),
    home: home.replace(/^\*\s*/, ""),
    result: result || undefined,
    venue:
      cleanText($row.find(".field .zoom-field").attr("title"))?.replace(
        /^Afficher les matchs du terrain\s*/i,
        "",
      ) || cleanText($row.find(".field").text()) || undefined,
    division:
      cleanText($row.find(".division .zoom-field").attr("title"))?.replace(
        /^Afficher les matchs de la division\s*/i,
        "",
      ) || cleanText($row.find(".division").text()) || undefined,
  };
}

function parseScheduleFromTable($: cheerio.CheerioAPI): PlaniligueMatch[] {
  const schedule: PlaniligueMatch[] = [];

  // Columns on tournament_public.php: Division | Match No | Jour | Date | Heure | Visiteur | Résultat | Receveur | Terrain
  $("table tr").each((_, row) => {
    const $cells = $(row).find("td");
    if ($cells.length < 8) return;

    const visitor = cleanText($cells.eq(5).find("[title]").attr("title") ?? "")
      || cleanText($cells.eq(5).text()).replace(/^\*\s*/, "");
    const home = cleanText($cells.eq(7).find("[title]").attr("title") ?? "")
      || cleanText($cells.eq(7).text()).replace(/^\*\s*/, "");
    if (!visitor && !home) return;

    schedule.push({
      matchNo: cleanText($cells.eq(1).text()) || undefined,
      day: cleanText($cells.eq(2).text()) || undefined,
      date: cleanText($cells.eq(3).text()) || undefined,
      time: cleanText($cells.eq(4).text()) || undefined,
      visitor,
      home,
      result: cleanText($cells.eq(6).text()) || undefined,
      venue: cleanText($cells.eq(8).text()) || undefined,
      division: cleanText($cells.eq(0).text()) || undefined,
    });
  });

  return schedule;
}

export async function scrapeSchedule(scheduleUrl: string): Promise<{
  schedule: PlaniligueMatch[];
  tournamentName?: string;
}> {
  const html = await fetchHtml(scheduleUrl);
  const $ = cheerio.load(html);
  const tournamentName = cleanText($("h3").first().text()) || undefined;
  const schedule: PlaniligueMatch[] = [];

  // Primary format: SEO-style pages (/horaire/...)
  $(".schedule-info .row.info_sc").each((_, row) => {
    const match = parseMatchRow($, row);
    if (match) schedule.push(match);
  });

  // Fallback: tournament_public.php table format
  if (schedule.length === 0) {
    schedule.push(...parseScheduleFromTable($));
  }

  return { schedule, tournamentName };
}

function parseScoreFromResult(result: string): { dom: string; ext: string } | null {
  const m = result.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (!m) return null;
  return { dom: m[1], ext: m[2] };
}

function buildLastMatch(schedule: PlaniligueMatch[]): PlaniligueTournamentData["lastMatch"] {
  const played = schedule.filter((m) => m.result && /\d/.test(m.result));
  if (!played.length) return undefined;
  const last = played[played.length - 1];
  const scores = last.result ? parseScoreFromResult(last.result) : null;
  if (!scores) return undefined;

  return {
    equipe_dom: last.visitor,
    equipe_ext: last.home,
    score_dom: scores.dom,
    score_ext: scores.ext,
    date: last.date ? `${last.date}${last.time ? ` ${last.time}` : ""}`.trim() : undefined,
  };
}

export async function scrapePlaniligueTournament(
  rawUrl: string,
): Promise<PlaniligueTournamentData> {
  const parsed = parsePlaniligueUrl(rawUrl);
  const standingUrl = standingPageUrl(parsed.tournamentId, parsed.filterDivision);
  const standingHtml = await fetchHtml(standingUrl);
  const nav = discoverNavUrls(standingHtml, standingUrl);
  const derived = deriveSeoUrls(parsed);

  const teamsUrl = nav.teamsUrl ?? derived.teamsUrl;
  // When filter_division is set, the SEO /horaire/ URL found in nav covers the full
  // tournament (all divisions). Always prefer the filtered query-param URL in that case.
  const scheduleUrl = parsed.filterDivision
    ? schedulePageUrl(parsed.tournamentId, parsed.filterDivision)
    : nav.scheduleUrl ?? derived.scheduleUrl;

  const [standingsResult, teamsResult, scheduleResult] = await Promise.all([
    scrapeStandings(standingUrl).catch(() => ({
      divisions: [] as PlaniligueStandingDivision[],
      tournamentName: nav.tournamentName,
    })),
    teamsUrl
      ? scrapeTeams(teamsUrl).catch(() => ({
          teams: [] as PlaniligueTeam[],
          tournamentName: undefined,
        }))
      : Promise.resolve({ teams: [] as PlaniligueTeam[], tournamentName: undefined }),
    scheduleUrl
      ? scrapeSchedule(scheduleUrl).catch(() => ({
          schedule: [] as PlaniligueMatch[],
          tournamentName: undefined,
        }))
      : Promise.resolve({ schedule: [] as PlaniligueMatch[], tournamentName: undefined }),
  ]);

  const tournamentName =
    standingsResult.tournamentName ??
    teamsResult.tournamentName ??
    scheduleResult.tournamentName ??
    nav.tournamentName;

  const schedule = scheduleResult.schedule ?? [];
  const lastMatch = buildLastMatch(schedule);

  return {
    provider: "planiligue",
    tournamentId: parsed.tournamentId,
    tournamentName,
    sport: parsed.sport,
    sourceUrl: parsed.sourceUrl,
    teams: teamsResult.teams ?? [],
    standings: standingsResult.divisions ?? [],
    schedule,
    lastMatch,
    importedAt: new Date().toISOString(),
  };
}

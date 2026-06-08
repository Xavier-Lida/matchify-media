import { NextResponse } from "next/server";
import { requireUserSession, UserAuthError } from "@/lib/api/require-user";
import { getStandingsHandler } from "@/lib/standings";
import { fromRaw } from "@/lib/league-data";
import { parsePlaniligueUrl, standingPageUrl } from "@/lib/planiligue";
import * as cheerio from "cheerio";
import type { StandingsProvider } from "@/lib/types-user";

const PROVIDERS: StandingsProvider[] = ["spordle", "planiligue", "matchify"];

function isProvider(value: string): value is StandingsProvider {
  return PROVIDERS.includes(value as StandingsProvider);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider: raw } = await params;
    if (!isProvider(raw)) {
      return NextResponse.json({ error: "Fournisseur inconnu." }, { status: 400 });
    }

    await requireUserSession();
    const body = (await request.json()) as { config?: Record<string, unknown> };
    const config = body.config ?? {};

    type DivisionOption = { id: string | null; name: string };

    // Fast path: if the URL already has filter_division, just look up the name
    if (raw === "planiligue") {
      const leagueUrl = typeof config.leagueUrl === "string" ? config.leagueUrl.trim() : "";
      let filterDivision: string | null = null;
      try { filterDivision = new URL(leagueUrl).searchParams.get("filter_division"); } catch { /* */ }

      if (filterDivision) {
        const parsed = parsePlaniligueUrl(leagueUrl);
        const baseUrl = standingPageUrl(parsed.tournamentId);
        const html = await fetch(baseUrl, { headers: { "User-Agent": "Mozilla/5.0 (MatchifyMedia/1.0)" } }).then(r => r.text());
        const $ = cheerio.load(html);
        const tournamentName = $("h3").first().text().replace(/\s+/g, " ").trim() || "";
        const divisionName =
          $(`#filter_division option[link*="-${filterDivision}/"], select[name="filter_division"] option[link*="-${filterDivision}/"]`)
            .first().text().replace(/\s+/g, " ").trim() || "";

        return NextResponse.json({
          leagueName: tournamentName,
          divisions: [{ id: filterDivision, name: divisionName || filterDivision }],
        });
      }
    }

    const handler = getStandingsHandler(raw);
    const data = await handler.sync(config);
    const unified = fromRaw(data as Record<string, unknown>);

    const rawData = data as Record<string, unknown>;
    const divisions: DivisionOption[] = [];

    const rawDivisions = Array.isArray(rawData.standings)
      ? (rawData.standings as Array<{ name?: string; divisionId?: string }>).filter(d => d.name)
      : [];

    for (const div of rawDivisions) {
      if (rawDivisions.length === 1 || div.name !== unified.leagueName) {
        divisions.push({ id: div.divisionId ?? null, name: div.name! });
      }
    }

    if (divisions.length === 0 && unified.divisionName) {
      divisions.push({ id: null, name: unified.divisionName });
    }

    return NextResponse.json({
      leagueName: unified.leagueName,
      divisions,
    });
  } catch (err) {
    if (err instanceof UserAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Échec du chargement.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

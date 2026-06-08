import "server-only";

import { scrapeSpordleMatch, isValidSpordleUrl } from "@/lib/spordle";
import type { StandingsProviderHandler } from "./types";

export const spordleStandingsHandler: StandingsProviderHandler = {
  provider: "spordle",

  async sync(config) {
    const leagueUrl =
      typeof config.leagueUrl === "string" ? config.leagueUrl : "";
    if (!leagueUrl || !isValidSpordleUrl(leagueUrl)) {
      throw new Error("URL Spordle invalide.");
    }

    const match = await scrapeSpordleMatch(leagueUrl);
    return {
      lastMatch: match,
      equipe_dom: match.equipe_dom,
      equipe_ext: match.equipe_ext,
      score_dom: match.score_dom,
      score_ext: match.score_ext,
      date: match.date,
      buteurs: match.buteurs,
    };
  },
};

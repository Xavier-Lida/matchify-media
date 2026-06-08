import "server-only";

import { scrapePlaniligueTournament } from "@/lib/planiligue";
import type { StandingsProviderHandler } from "./types";

export const planiligueStandingsHandler: StandingsProviderHandler = {
  provider: "planiligue",

  async sync(config) {
    const leagueUrl =
      typeof config.leagueUrl === "string" ? config.leagueUrl.trim() : "";
    if (!leagueUrl) {
      throw new Error("URL Planiligue requise.");
    }

    const data = await scrapePlaniligueTournament(leagueUrl);
    return { ...data };
  },
};

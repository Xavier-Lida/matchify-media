import "server-only";

import type { StandingsProviderHandler } from "./types";

/** Stub — endpoint matchify.ca à brancher. */
export const matchifyStandingsHandler: StandingsProviderHandler = {
  provider: "matchify",

  async sync(config) {
    const leagueId =
      typeof config.leagueId === "string" ? config.leagueId : "";
    if (!leagueId) {
      throw new Error("Identifiant de ligue Matchify requis.");
    }
    return {
      note: "Synchronisation Matchify.ca non implémentée — données en attente.",
      leagueId,
    };
  },
};

import "server-only";

import type { StandingsProvider } from "@/lib/types-user";
import { matchifyStandingsHandler } from "./matchify";
import { planiligueStandingsHandler } from "./planiligue";
import { spordleStandingsHandler } from "./spordle";
import type { StandingsProviderHandler } from "./types";

const handlers: Record<StandingsProvider, StandingsProviderHandler> = {
  spordle: spordleStandingsHandler,
  planiligue: planiligueStandingsHandler,
  matchify: matchifyStandingsHandler,
};

export function getStandingsHandler(
  provider: StandingsProvider,
): StandingsProviderHandler {
  return handlers[provider];
}

export type { StandingsProviderHandler, StandingsSyncResult } from "./types";

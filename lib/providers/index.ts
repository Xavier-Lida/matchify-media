import type { StandingsProvider } from "@/lib/types-user";
import type { LeagueProvider } from "./_base";
import { planiligueProvider } from "./planiligue";
import { spordleProvider } from "./spordle";
import { matchifyProvider } from "./matchify";

export type { LeagueProvider, ProviderConfig, ProviderInputType } from "./_base";

const REGISTRY: Record<StandingsProvider, LeagueProvider> = {
  planiligue: planiligueProvider,
  spordle: spordleProvider,
  matchify: matchifyProvider,
};

export const PROVIDERS: LeagueProvider[] = Object.values(REGISTRY);

export function getProvider(id: StandingsProvider): LeagueProvider {
  return REGISTRY[id];
}

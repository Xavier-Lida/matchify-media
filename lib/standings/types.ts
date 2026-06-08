import type { SpordleMatchData } from "@/lib/spordle-types";
import type { StandingsProvider } from "@/lib/types-user";

export interface StandingsSyncResult {
  provider: StandingsProvider;
  data: Record<string, unknown>;
  importedAt: string;
}

export type { SpordleMatchData };

export interface StandingsProviderHandler {
  readonly provider: StandingsProvider;
  sync(config: Record<string, unknown>): Promise<Record<string, unknown>>;
}

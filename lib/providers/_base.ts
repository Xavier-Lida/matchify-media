import type { StandingsProvider } from "@/lib/types-user";

export type ProviderInputType = "url" | "none";

export type ProviderConfig = Record<string, unknown>;

/**
 * Descripteur client-safe d'un provider.
 * Ne contient pas de logique de sync (server-only) — voir lib/standings/.
 */
export interface LeagueProvider {
  readonly id: StandingsProvider;
  readonly label: string;
  readonly inputType: ProviderInputType;
  /** Affiché dans le champ URL (uniquement si inputType === "url"). */
  readonly urlPlaceholder?: string;
  /** Retourne un message d'erreur, ou null si la config est valide. */
  validateConfig(config: ProviderConfig): string | null;
}

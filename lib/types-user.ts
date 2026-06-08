export type StandingsProvider = "spordle" | "planiligue" | "matchify";

export type LeagueDataSource = "manual" | StandingsProvider;

export interface Profile {
  id: string;
  display_name: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  project_settings: Record<string, unknown>;
  created_at: string;
}

export interface LeagueDataRow {
  project_id: string;
  data: Record<string, unknown>;
  source: LeagueDataSource;
  updated_at: string;
}

export interface ProjectIntegration {
  id: string;
  project_id: string;
  provider: StandingsProvider;
  config: Record<string, unknown>;
  status: "idle" | "connected" | "error";
  last_sync_at: string | null;
  created_at: string;
}

export interface Publication {
  id: string;
  project_id: string;
  user_id: string;
  template_id: string | null;
  format: "png" | "jpeg" | "html";
  title: string | null;
  storage_path: string | null;
  created_at: string;
}

export interface ProjectAsset {
  id: string;
  project_id: string;
  file_path: string;
  label: string | null;
  created_at: string;
}

export const STANDINGS_PROVIDER_LABELS: Record<StandingsProvider, string> = {
  spordle: "Spordle",
  planiligue: "Planiligue",
  matchify: "Matchify.ca",
};

export interface LeagueTeamEntry {
  name: string;
  logo: string | null;
  pj: number | null;
  v: number | null;
  n: number | null;
  d: number | null;
  bp: number | null;
  bc: number | null;
  diff: number | null;
  pts: number | null;
}

export interface LeagueMatchEntry {
  date: string;
  time: string;
  home: string;
  visitor: string;
  result: string;
  venue: string;
}

export interface UnifiedLeagueData {
  leagueName: string;
  divisionName: string;
  leagueLogo: string | null;
  standings: LeagueTeamEntry[];
  schedule: LeagueMatchEntry[];
  _provider?: string;
  _importedAt?: string;
  _sourceUrl?: string;
}

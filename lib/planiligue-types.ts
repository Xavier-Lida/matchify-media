export interface PlaniligueTeam {
  name: string;
  club?: string;
  category?: string;
  class?: string;
  gender?: string;
}

export interface PlaniligueStandingRow {
  position: number;
  team: string;
  pj: number | null;
  v: number | null;
  n: number | null;
  d: number | null;
  bp: number | null;
  bc: number | null;
  diff: number | null;
  pts: number | null;
}

export interface PlaniligueStandingGroup {
  name: string;
  rows: PlaniligueStandingRow[];
}

export interface PlaniligueStandingDivision {
  name: string;
  divisionId?: string;
  groups: PlaniligueStandingGroup[];
}

export interface PlaniligueMatch {
  matchNo?: string;
  day?: string;
  date?: string;
  time?: string;
  visitor: string;
  home: string;
  result?: string;
  venue?: string;
  division?: string;
}

export interface PlaniligueTournamentData {
  provider: "planiligue";
  tournamentId: number;
  tournamentName?: string;
  sport?: string;
  sourceUrl: string;
  teams: PlaniligueTeam[];
  standings: PlaniligueStandingDivision[];
  schedule: PlaniligueMatch[];
  lastMatch?: {
    equipe_dom: string;
    equipe_ext: string;
    score_dom: string;
    score_ext: string;
    date?: string;
  };
  importedAt: string;
}

export interface ParsedPlaniligueUrl {
  sourceUrl: string;
  tournamentId: number;
  filterDivision?: string;
  sport?: string;
  slug?: string;
}

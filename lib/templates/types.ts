import type { ComponentType } from "react";

export type Branding = {
  leagueName: string;
  primaryColor: string;
  secondaryColor: string;
  logoDataUrl: string | null;
};

export const DEFAULT_BRANDING: Branding = {
  leagueName: "MERIDIAN",
  primaryColor: "#0A1426",
  secondaryColor: "#D4A24C",
  logoDataUrl: null,
};

export type TeamSide = {
  name: string;
  logo: string | null;
  score?: number;
};

export type FullTimeScorer = {
  name: string;
  goals: number;
};

export type FullTimeTeam = {
  logo: string | null;
};

export type FullTimeData = {
  heroPhoto: string | null;
  date: string;
  fieldName: string;
  matchday: string;
  season: string;
  teamA: FullTimeTeam;
  teamB: FullTimeTeam;
  scoreA: number;
  scoreB: number;
  scorersA: FullTimeScorer[];
  scorersB: FullTimeScorer[];
};

export type MatchDayData = {
  teamA: TeamSide;
  teamB: TeamSide;
  dateTime: string;
  venue: string;
  matchday: string;
};

export type StandingsRow = {
  rank: number;
  teamName: string;
  logo: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  points: number;
};

export type StandingsData = {
  title: string;
  rows: StandingsRow[];
};

export type TemplateId = "fulltime" | "matchday" | "standings";

export type TemplateVisualProps<T> = {
  data: T;
  branding: Branding;
};

export type TemplateFormProps<T> = {
  data: T;
  onChange: (data: T) => void;
};

export type TemplateEntry<T> = {
  id: TemplateId;
  label: string;
  description: string;
  defaults: T;
  Visual: ComponentType<TemplateVisualProps<T>>;
  Form: ComponentType<TemplateFormProps<T>>;
};

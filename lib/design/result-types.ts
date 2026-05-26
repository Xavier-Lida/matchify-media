export type ResultTeam = {
  logo_url: string | null;
};

export type ResultScorer = {
  name: string;
  goals: number;
};

export type ResultData = {
  league: {
    name: string;
    division: string;
    season: string;
    matchday: string | number;
    field_name: string;
    logo_url: string | null;
  };
  date: string;
  home: ResultTeam;
  away: ResultTeam;
  score: [number, number];
  scorers: {
    home: ResultScorer[];
    away: ResultScorer[];
  };
  hero_photo: string | null;
};

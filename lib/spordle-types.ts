/** Données structurées renvoyées par GET /api/spordle (partagé client/serveur). */
export interface SpordleScorer {
  nom: string;
  equipe: "dom" | "ext";
  buts: number;
}

export interface SpordleMatchData {
  equipe_dom: string;
  equipe_ext: string;
  score_dom: number | null;
  score_ext: number | null;
  logo_dom: string | null;
  logo_ext: string | null;
  date: string | null;
  buteurs: SpordleScorer[];
}

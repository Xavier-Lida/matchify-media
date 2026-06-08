/**
 * Types partagés entre client (Konva), serveur (@napi-rs/canvas) et API.
 * Référence: SPEC.md — « Système de templates (JSON config) ».
 */

export type FieldType = "text" | "number" | "image" | "list" | "shape";

// ─── Data requirements ────────────────────────────────────────────────────────

// ─── Field data sources ───────────────────────────────────────────────────────

export type FieldDataSource =
  // Match scalaire
  | "match.home"           | "match.visitor"
  | "match.score_home"     | "match.score_visitor"
  | "match.date"           | "match.time"
  | "match.home_logo"      | "match.visitor_logo"
  | "match.result"         // résultat brut ex : "2-1"
  // Listes de matchs (pour champs list uniquement)
  | "schedule.results"     // derniers matchs joués (jusqu'à maxItems)
  | "schedule.upcoming"    // prochains matchs non joués (jusqu'à maxItems)
  // Équipe individuelle
  | "team.name"            | "team.logo"
  | "team.pts"             | "team.position"
  | "team.pj"              | "team.v"
  | "team.n"               | "team.d"
  | "team.bp"              | "team.bc"
  // Ligue / division
  | "league.name"          | "league.division"          | "league.logo"
  // Classement entier
  | "standings.json";

/** Sous-ensemble de FieldDataSource utilisable sur les colonnes d'un ListSubfield. */
export type MatchSubfieldSource =
  | "match.home"
  | "match.visitor"
  | "match.date"
  | "match.time"
  | "match.result"
  | "match.score_home"
  | "match.score_visitor";

export type DataRequirementType =
  | "last_match"    // Dernier match joué (automatique)
  | "next_match"    // Prochain match à venir (automatique)
  | "match_pick"    // L'utilisateur choisit un match dans l'horaire
  | "results_pick"  // L'utilisateur choisit plusieurs matchs (alimente un champ list)
  | "standings"     // Classement complet (automatique)
  | "team_pick"     // L'utilisateur choisit une équipe dans le classement
  | "league";       // Données de la ligue (nom, logo, division) — automatique

export interface DataRequirement {
  id: string;              // identifiant unique dans le template (ex. "match")
  type: DataRequirementType;
  label: string;           // texte affiché à l'utilisateur
  maxItems?: number;       // pour results_pick : nombre max de matchs sélectionnables
  /** Restreint les matchs affichés à l'utilisateur : joués, à venir, ou tous (défaut). */
  matchFilter?: "all" | "played" | "upcoming";
}

export type TemplateType = "resultat" | "classement" | "annonce" | "horaire";

export type TextAlign = "left" | "center" | "right";

export interface BaseField {
  key: string;
  type: FieldType;
  label: string;
  x: number;
  y: number;
  required?: boolean;
  /** Source de données automatique pour le pré-remplissage. */
  dataSource?: FieldDataSource;
  /** ID du requirement associé (si le template a plusieurs requirements du même type). */
  requirementId?: string;
  /**
   * Si true, un champ de saisie apparaît dans le panneau latéral avant l'export
   * pour que l'utilisateur puisse saisir ou corriger la valeur (même si dataSource
   * est défini). Utile pour les champs texte semi-automatiques (ex. titre, journée).
   */
  userEditable?: boolean;
}

export interface TextField extends BaseField {
  type: "text";
  fontSize: number;
  fontFamily?: string;
  bold?: boolean;
  color?: string;
  align?: TextAlign;
  maxLength?: number;
}

export interface NumberField extends BaseField {
  type: "number";
  fontSize: number;
  fontFamily?: string;
  bold?: boolean;
  color?: string;
  align?: TextAlign;
  min?: number;
  max?: number;
}

export type ImageLayer = "background" | "foreground";

export interface ImageField extends BaseField {
  type: "image";
  width: number;
  height: number;
  /** Plan de rendu : arrière-plan (sous le texte) ou premier plan (défaut). */
  layer?: ImageLayer;
  /** Comportement de redimensionnement : cover (recadrage centré, défaut) ou contain (image entière, centrée). */
  fit?: "cover" | "contain";
}

export interface ListSubfield {
  key: string;
  type: "text" | "number";
  label: string;
  offsetX: number;
  fontSize: number;
  fontFamily?: string;
  bold?: boolean;
  color?: string;
  align?: TextAlign;
  /** Source de données automatique pour peupler cette colonne depuis un match. */
  dataSource?: MatchSubfieldSource;
}

export interface ListField extends BaseField {
  type: "list";
  rowHeight: number;
  maxItems: number;
  subfields: ListSubfield[];
}

/** Rectangle décoratif (admin uniquement, pas de saisie utilisateur). */
export interface ShapeField extends BaseField {
  type: "shape";
  width: number;
  height: number;
  fill: string;
  opacity: number;
  layer?: ImageLayer;
}

export type Field = TextField | NumberField | ImageField | ListField | ShapeField;

export interface JsonConfig {
  canvasWidth: number;
  canvasHeight: number;
  fields: Field[];
  /** Valeurs d'exemple pour générer preview_url à la sauvegarde admin. */
  sampleValues?: FieldValues;
  /** Données nécessaires pour générer le visuel automatiquement. */
  requirements?: DataRequirement[];
  /** Présent si le template est rendu via HTML/JS plutôt que canvas. */
  templateMode?: "canvas" | "html";
  htmlUrl?: string;
  htmlSchema?: HtmlSchema;
  htmlDefaultData?: Record<string, unknown>;
}

// ─── HTML/JS template types ───────────────────────────────────────────────────

export type HtmlFieldType = "text" | "image" | "number";

export interface HtmlSchemaField {
  key: string;
  label: string;
  type: HtmlFieldType;
}

export type HtmlSectionType = "text" | "image" | "number" | "object" | "array";

export interface HtmlSchemaSection {
  key: string;
  label: string;
  type: HtmlSectionType;
  fields?: HtmlSchemaField[];
  arrayItem?: HtmlSchemaField[];
  /** Links to a DataRequirement id in json_config.requirements. Data flows automatically. */
  requirementId?: string;
}

export interface HtmlSchema {
  sections: HtmlSchemaSection[];
}

export type HtmlFormValues = Record<
  string,
  string | Array<Record<string, string>>
>;

export interface ListItem {
  [subfieldKey: string]: string | number;
}

export type FieldValue = string | number | string[] | ListItem[];

export interface FieldValues {
  [key: string]: FieldValue;
}

/** Surcharge de style appliquée côté éditeur (couleur / police par champ). */
export interface FieldStyleOverride {
  color?: string;
  fontFamily?: string;
  bold?: boolean;
}

export type StyleOverrides = Record<string, FieldStyleOverride>;

/** Ligne de la table Supabase `templates`. */
export interface Template {
  id: string;
  nom: string;
  type: TemplateType;
  description: string | null;
  png_url: string;
  preview_url: string;
  json_config: JsonConfig;
  actif: boolean;
  created_at: string;
}

export const TEMPLATE_TYPES: TemplateType[] = [
  "resultat",
  "classement",
  "annonce",
  "horaire",
];

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  resultat: "Résultat",
  classement: "Classement",
  annonce: "Annonce",
  horaire: "Horaire",
};

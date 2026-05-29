/**
 * Types partagés entre client (Konva), serveur (@napi-rs/canvas) et API.
 * Référence: SPEC.md — « Système de templates (JSON config) ».
 */

export type FieldType = "text" | "number" | "image" | "list";

export type TemplateType = "resultat" | "classement" | "annonce" | "horaire";

export type TextAlign = "left" | "center" | "right";

export interface BaseField {
  key: string;
  type: FieldType;
  label: string;
  x: number;
  y: number;
  required?: boolean;
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
}

export interface ListField extends BaseField {
  type: "list";
  rowHeight: number;
  maxItems: number;
  subfields: ListSubfield[];
}

export type Field = TextField | NumberField | ImageField | ListField;

export interface JsonConfig {
  canvasWidth: number;
  canvasHeight: number;
  fields: Field[];
  /** Valeurs d'exemple pour générer preview_url à la sauvegarde admin. */
  sampleValues?: FieldValues;
}

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

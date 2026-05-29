/**
 * Logique de rendu PURE, partagée entre l'éditeur client (Konva) et le rendu
 * serveur (@napi-rs/canvas).
 *
 * Ordre de rendu : images background → png_url → texte/listes → images foreground.
 * Les champs image utilisent object-fit cover (recadrage centré, pas d'étirement).
 */

import type {
  Field,
  FieldType,
  FieldValue,
  FieldValues,
  ImageField,
  ImageLayer,
  JsonConfig,
  ListField,
  ListItem,
  NumberField,
  StyleOverrides,
  TextAlign,
  TextField,
} from "@/lib/types";

export const DEFAULT_FONT_FAMILY = "Arial";
export const DEFAULT_TEXT_COLOR = "#ffffff";
export const DEFAULT_ALIGN: TextAlign = "left";

export interface TextInstruction {
  kind: "text";
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  color: string;
  align: TextAlign;
  maxWidth?: number;
}

export interface ImageInstruction {
  kind: "image";
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type RenderInstruction = TextInstruction | ImageInstruction;

export interface LayeredRenderPlan {
  background: RenderInstruction[];
  content: RenderInstruction[];
  foreground: RenderInstruction[];
}

function imageLayer(field: ImageField): ImageLayer {
  return field.layer ?? "foreground";
}

function toText(value: FieldValue | undefined): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return "";
  return String(value);
}

function asListItems(value: FieldValue | undefined): ListItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ListItem => typeof item === "object" && item !== null,
  );
}

type FieldPlanner<F extends Field> = (
  field: F,
  value: FieldValue | undefined,
  overrides: StyleOverrides,
) => RenderInstruction[];

const planText: FieldPlanner<TextField | NumberField> = (
  field,
  value,
  overrides,
) => {
  const text = toText(value);
  if (text === "") return [];
  const override = overrides[field.key] ?? {};
  return [
    {
      kind: "text",
      id: field.key,
      text,
      x: field.x,
      y: field.y,
      fontSize: field.fontSize,
      fontFamily:
        override.fontFamily ?? field.fontFamily ?? DEFAULT_FONT_FAMILY,
      bold: override.bold ?? field.bold ?? false,
      color: override.color ?? field.color ?? DEFAULT_TEXT_COLOR,
      align: field.align ?? DEFAULT_ALIGN,
    },
  ];
};

const planImage: FieldPlanner<ImageField> = (field, value) => {
  const src = toText(value);
  if (src === "") return [];
  return [
    {
      kind: "image",
      id: field.key,
      src,
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
    },
  ];
};

const planList: FieldPlanner<ListField> = (field, value, overrides) => {
  const items = asListItems(value).slice(0, field.maxItems);
  const instructions: RenderInstruction[] = [];

  items.forEach((item, index) => {
    const rowY = field.y + index * field.rowHeight;
    for (const sub of field.subfields) {
      const cellText = toText(item[sub.key]);
      if (cellText === "") continue;
      const override = overrides[`${field.key}.${sub.key}`] ?? {};
      instructions.push({
        kind: "text",
        id: `${field.key}.${sub.key}.${index}`,
        text: cellText,
        x: field.x + sub.offsetX,
        y: rowY,
        fontSize: sub.fontSize,
        fontFamily:
          override.fontFamily ?? sub.fontFamily ?? DEFAULT_FONT_FAMILY,
        bold: override.bold ?? sub.bold ?? false,
        color: override.color ?? sub.color ?? DEFAULT_TEXT_COLOR,
        align: sub.align ?? DEFAULT_ALIGN,
      });
    }
  });

  return instructions;
};

const PLANNERS: {
  [K in FieldType]: FieldPlanner<Extract<Field, { type: K }>>;
} = {
  text: planText as FieldPlanner<TextField>,
  number: planText as FieldPlanner<NumberField>,
  image: planImage,
  list: planList,
};

const LAYER_TARGETS: Record<
  FieldType,
  (field: Field) => keyof LayeredRenderPlan
> = {
  text: () => "content",
  number: () => "content",
  list: () => "content",
  image: (field) =>
    imageLayer(field as ImageField) === "background" ? "background" : "foreground",
};

/**
 * Plan de rendu par couche (z-order).
 */
export function buildLayeredRenderPlan(
  config: JsonConfig,
  values: FieldValues,
  overrides: StyleOverrides = {},
): LayeredRenderPlan {
  const plan: LayeredRenderPlan = {
    background: [],
    content: [],
    foreground: [],
  };

  for (const field of config.fields) {
    const planner = PLANNERS[field.type] as FieldPlanner<Field>;
    const target = LAYER_TARGETS[field.type](field);
    plan[target].push(...planner(field, values[field.key], overrides));
  }

  return plan;
}

/** Liste aplatie (background → content → foreground) — rétrocompat. */
export function buildRenderPlan(
  config: JsonConfig,
  values: FieldValues,
  overrides: StyleOverrides = {},
): RenderInstruction[] {
  const layered = buildLayeredRenderPlan(config, values, overrides);
  return [
    ...layered.background,
    ...layered.content,
    ...layered.foreground,
  ];
}

export function toFontString(
  fontSize: number,
  fontFamily: string,
  bold = false,
): string {
  return `${bold ? "bold" : "normal"} ${fontSize}px "${fontFamily}"`;
}

/** Recadrage source pour remplir une boîte (équivalent CSS object-fit: cover, centre). */
export function computeCoverCrop(
  srcWidth: number,
  srcHeight: number,
  destWidth: number,
  destHeight: number,
): { sx: number; sy: number; sWidth: number; sHeight: number } {
  if (srcWidth <= 0 || srcHeight <= 0 || destWidth <= 0 || destHeight <= 0) {
    return { sx: 0, sy: 0, sWidth: srcWidth, sHeight: srcHeight };
  }
  const scale = Math.max(destWidth / srcWidth, destHeight / srcHeight);
  const sWidth = destWidth / scale;
  const sHeight = destHeight / scale;
  return {
    sx: (srcWidth - sWidth) / 2,
    sy: (srcHeight - sHeight) / 2,
    sWidth,
    sHeight,
  };
}

export function hasSampleValues(values: FieldValues | undefined): boolean {
  if (!values) return false;
  return Object.values(values).some((v) => {
    if (v === null || v === undefined) return false;
    if (typeof v === "string") return v.trim() !== "";
    if (typeof v === "number") return true;
    if (Array.isArray(v)) return v.length > 0;
    return false;
  });
}

type RequiredValidator = (field: Field, value: FieldValue | undefined) => boolean;

const isEmptyScalar: RequiredValidator = (_field, value) =>
  value === null || value === undefined || String(value).trim() === "";

const isEmptyList: RequiredValidator = (_field, value) =>
  !Array.isArray(value) || value.length === 0;

const REQUIRED_VALIDATORS: Record<FieldType, RequiredValidator> = {
  text: isEmptyScalar,
  number: isEmptyScalar,
  image: isEmptyScalar,
  list: isEmptyList,
};

export function getMissingRequiredFields(
  config: JsonConfig,
  values: FieldValues,
): string[] {
  const missing: string[] = [];
  for (const field of config.fields) {
    if (!field.required) continue;
    const isEmpty = REQUIRED_VALIDATORS[field.type];
    if (isEmpty(field, values[field.key])) {
      missing.push(field.key);
    }
  }
  return missing;
}

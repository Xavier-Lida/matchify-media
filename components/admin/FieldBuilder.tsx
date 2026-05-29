"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_FONT_FAMILY } from "@/lib/canvas";
import { useAvailableFonts } from "@/lib/hooks/use-available-fonts";
import type {
  Field,
  FieldType,
  ImageLayer,
  ListSubfield,
  TextAlign,
} from "@/lib/types";

interface FieldBuilderProps {
  backgroundUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  fields: Field[];
  onChange: (fields: Field[]) => void;
}

/** Brouillon « superset » couvrant toutes les propriétés possibles. */
interface Draft {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  color: string;
  align: TextAlign;
  width: number;
  height: number;
  rowHeight: number;
  maxItems: number;
  subfields: ListSubfield[];
  layer: ImageLayer;
}

function emptyDraft(): Draft {
  return {
    key: "",
    label: "",
    type: "text",
    required: false,
    x: 100,
    y: 100,
    fontSize: 36,
    fontFamily: DEFAULT_FONT_FAMILY,
    bold: false,
    color: "#ffffff",
    align: "left",
    width: 120,
    height: 120,
    rowHeight: 32,
    maxItems: 8,
    subfields: [],
    layer: "foreground",
  };
}

function draftFromField(field: Field): Draft {
  const base = emptyDraft();
  base.key = field.key;
  base.label = field.label;
  base.type = field.type;
  base.required = field.required ?? false;
  base.x = field.x;
  base.y = field.y;
  if (field.type === "text" || field.type === "number") {
    base.fontSize = field.fontSize;
    base.fontFamily = field.fontFamily ?? DEFAULT_FONT_FAMILY;
    base.bold = field.bold ?? false;
    base.color = field.color ?? "#ffffff";
    base.align = field.align ?? "left";
  }
  if (field.type === "image") {
    base.width = field.width;
    base.height = field.height;
    base.layer = field.layer ?? "foreground";
  }
  if (field.type === "list") {
    base.rowHeight = field.rowHeight;
    base.maxItems = field.maxItems;
    base.subfields = field.subfields;
  }
  return base;
}

// Assemblage du Field final selon le type (handler map — pas de if/else).
const FIELD_ASSEMBLERS: Record<FieldType, (d: Draft) => Field> = {
  text: (d) => ({
    key: d.key,
    label: d.label,
    type: "text",
    x: d.x,
    y: d.y,
    required: d.required,
    fontSize: d.fontSize,
    fontFamily: d.fontFamily,
    bold: d.bold,
    color: d.color,
    align: d.align,
  }),
  number: (d) => ({
    key: d.key,
    label: d.label,
    type: "number",
    x: d.x,
    y: d.y,
    required: d.required,
    fontSize: d.fontSize,
    fontFamily: d.fontFamily,
    bold: d.bold,
    color: d.color,
    align: d.align,
  }),
  image: (d) => ({
    key: d.key,
    label: d.label,
    type: "image",
    x: d.x,
    y: d.y,
    required: d.required,
    width: d.width,
    height: d.height,
    ...(d.layer !== "foreground" ? { layer: d.layer } : {}),
  }),
  list: (d) => ({
    key: d.key,
    label: d.label,
    type: "list",
    x: d.x,
    y: d.y,
    required: d.required,
    rowHeight: d.rowHeight,
    maxItems: d.maxItems,
    subfields: d.subfields,
  }),
};

const numInput =
  "w-full rounded border border-border bg-surface px-2 py-1 text-sm outline-none focus:border-accent";

export function FieldBuilder({
  backgroundUrl,
  canvasWidth,
  canvasHeight,
  fields,
  onChange,
}: FieldBuilderProps) {
  const { names: fontNames } = useAvailableFonts();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () =>
      setScale(Math.min(1, el.clientWidth / canvasWidth));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [canvasWidth]);

  const openCreate = () => {
    setEditingIndex(null);
    setDraft(emptyDraft());
  };
  const openEdit = (index: number) => {
    setEditingIndex(index);
    setDraft(draftFromField(fields[index]));
  };
  const cancel = () => setDraft(null);

  const save = () => {
    if (!draft) return;
    if (!draft.key.trim() || !draft.label.trim()) return;
    const field = FIELD_ASSEMBLERS[draft.type](draft);
    const next =
      editingIndex === null
        ? [...fields, field]
        : fields.map((f, i) => (i === editingIndex ? field : f));
    onChange(next);
    setDraft(null);
  };

  const removeField = (index: number) =>
    onChange(fields.filter((_, i) => i !== index));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      {/* Aperçu PNG + overlays */}
      <div ref={containerRef}>
        <div
          className="relative overflow-hidden rounded-xl border border-border bg-surface-2"
          style={{
            width: canvasWidth * scale,
            height: canvasHeight * scale,
            maxWidth: "100%",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backgroundUrl}
            alt="Fond du template"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {fields.map((field, index) => (
            <FieldOverlay
              key={`${field.key}-${index}`}
              field={field}
              scale={scale}
              onClick={() => openEdit(index)}
            />
          ))}
        </div>
      </div>

      {/* Liste des champs */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={openCreate}
          className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
        >
          + Ajouter un champ
        </button>
        <ul className="space-y-2">
          {fields.map((field, index) => (
            <li
              key={`${field.key}-${index}`}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <button
                type="button"
                onClick={() => openEdit(index)}
                className="text-left"
              >
                <span className="font-medium">{field.label}</span>
                <span className="ml-2 text-xs text-muted">
                  {field.key} · {field.type}
                  {field.type === "image"
                    ? ` · ${field.layer === "background" ? "arrière-plan" : "premier plan"}`
                    : ""}
                </span>
              </button>
              <button
                type="button"
                onClick={() => removeField(index)}
                className="text-xs text-muted hover:text-red-400"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>

      {draft ? (
        <FieldModal
          draft={draft}
          setDraft={setDraft}
          fontNames={fontNames}
          onSave={save}
          onCancel={cancel}
          isEdit={editingIndex !== null}
        />
      ) : null}
    </div>
  );
}

function FieldOverlay({
  field,
  scale,
  onClick,
}: {
  field: Field;
  scale: number;
  onClick: () => void;
}) {
  const left = field.x * scale;
  const top = field.y * scale;

  if (field.type === "image") {
    const isBg = field.layer === "background";
    return (
      <button
        type="button"
        onClick={onClick}
        className={`absolute border-2 bg-accent/10 ${
          isBg
            ? "border-dotted border-emerald-400/90"
            : "border-dashed border-accent/80"
        }`}
        style={{
          left,
          top,
          width: field.width * scale,
          height: field.height * scale,
        }}
        title={`${field.label} (${isBg ? "arrière-plan" : "premier plan"})`}
      />
    );
  }

  const align = "align" in field ? field.align ?? "left" : "left";
  const transform =
    align === "center"
      ? "translateX(-50%)"
      : align === "right"
        ? "translateX(-100%)"
        : "none";

  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute whitespace-nowrap rounded bg-accent/20 px-1 leading-tight outline outline-1 outline-accent/60"
      style={{
        left,
        top,
        transform,
        color: "color" in field ? field.color ?? "#fff" : "#fff",
        fontSize:
          ("fontSize" in field ? field.fontSize : 18) * scale,
      }}
      title={field.label}
    >
      {field.label}
    </button>
  );
}

function FieldModal({
  draft,
  setDraft,
  fontNames,
  onSave,
  onCancel,
  isEdit,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft | null>>;
  fontNames: string[];
  onSave: () => void;
  onCancel: () => void;
  isEdit: boolean;
}) {
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
      <div className="my-8 w-full max-w-lg space-y-4 rounded-xl border border-border bg-surface p-5">
        <h3 className="text-lg font-semibold">
          {isEdit ? "Modifier le champ" : "Nouveau champ"}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Clé">
            <input
              className={numInput}
              value={draft.key}
              onChange={(e) => set("key", e.target.value)}
              placeholder="ex: equipe_dom"
            />
          </Labeled>
          <Labeled label="Label">
            <input
              className={numInput}
              value={draft.label}
              onChange={(e) => set("label", e.target.value)}
            />
          </Labeled>
          <Labeled label="Type">
            <select
              className={numInput}
              value={draft.type}
              onChange={(e) => set("type", e.target.value as FieldType)}
            >
              <option value="text">text</option>
              <option value="number">number</option>
              <option value="image">image</option>
              <option value="list">list</option>
            </select>
          </Labeled>
          <Labeled label="Requis">
            <label className="flex items-center gap-2 py-1 text-sm">
              <input
                type="checkbox"
                checked={draft.required}
                onChange={(e) => set("required", e.target.checked)}
              />
              Champ obligatoire
            </label>
          </Labeled>
          <Labeled label="X (px)">
            <input
              type="number"
              className={numInput}
              value={draft.x}
              onChange={(e) => set("x", Number(e.target.value))}
            />
          </Labeled>
          <Labeled label="Y (px)">
            <input
              type="number"
              className={numInput}
              value={draft.y}
              onChange={(e) => set("y", Number(e.target.value))}
            />
          </Labeled>
        </div>

        <TypeSpecificFields draft={draft} set={set} fontNames={fontNames} />

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!draft.key.trim() || !draft.label.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

type SetDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => void;

// Section spécifique au type (handler map renvoyant le JSX).
function TypeSpecificFields({
  draft,
  set,
  fontNames,
}: {
  draft: Draft;
  set: SetDraft;
  fontNames: string[];
}) {
  const sections: Record<FieldType, () => React.ReactElement> = {
    text: () => <TextStyleFields draft={draft} set={set} fontNames={fontNames} />,
    number: () => <TextStyleFields draft={draft} set={set} fontNames={fontNames} />,
    image: () => (
      <div className="grid grid-cols-2 gap-3">
        <Labeled label="Couche">
          <select
            className={numInput}
            value={draft.layer}
            onChange={(e) => set("layer", e.target.value as ImageLayer)}
          >
            <option value="background">Arrière-plan</option>
            <option value="foreground">Premier plan</option>
          </select>
        </Labeled>
        <div />
        <Labeled label="Largeur (px)">
          <input
            type="number"
            className={numInput}
            value={draft.width}
            onChange={(e) => set("width", Number(e.target.value))}
          />
        </Labeled>
        <Labeled label="Hauteur (px)">
          <input
            type="number"
            className={numInput}
            value={draft.height}
            onChange={(e) => set("height", Number(e.target.value))}
          />
        </Labeled>
      </div>
    ),
    list: () => <ListFields draft={draft} set={set} fontNames={fontNames} />,
  };
  return sections[draft.type]();
}

function TextStyleFields({
  draft,
  set,
  fontNames,
}: {
  draft: Draft;
  set: SetDraft;
  fontNames: string[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Labeled label="Taille">
        <input
          type="number"
          className={numInput}
          value={draft.fontSize}
          onChange={(e) => set("fontSize", Number(e.target.value))}
        />
      </Labeled>
      <Labeled label="Police">
        <select
          className={numInput}
          value={draft.fontFamily}
          onChange={(e) => set("fontFamily", e.target.value)}
        >
          {fontNames.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </Labeled>
      <Labeled label="Gras">
        <label className="flex items-center gap-2 py-1 text-sm">
          <input
            type="checkbox"
            checked={draft.bold}
            onChange={(e) => set("bold", e.target.checked)}
          />
          Texte en gras
        </label>
      </Labeled>
      <Labeled label="Couleur">
        <input
          type="color"
          className="h-8 w-full rounded border border-border bg-surface"
          value={draft.color}
          onChange={(e) => set("color", e.target.value)}
        />
      </Labeled>
      <Labeled label="Alignement">
        <select
          className={numInput}
          value={draft.align}
          onChange={(e) => set("align", e.target.value as TextAlign)}
        >
          <option value="left">left</option>
          <option value="center">center</option>
          <option value="right">right</option>
        </select>
      </Labeled>
    </div>
  );
}

function ListFields({
  draft,
  set,
  fontNames,
}: {
  draft: Draft;
  set: SetDraft;
  fontNames: string[];
}) {
  const addSub = () =>
    set("subfields", [
      ...draft.subfields,
      {
        key: "",
        label: "",
        type: "text",
        offsetX: 0,
        fontSize: 18,
        fontFamily: DEFAULT_FONT_FAMILY,
        bold: false,
        color: "#ffffff",
      },
    ]);
  const updateSub = (index: number, patch: Partial<ListSubfield>) =>
    set(
      "subfields",
      draft.subfields.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  const removeSub = (index: number) =>
    set(
      "subfields",
      draft.subfields.filter((_, i) => i !== index),
    );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Labeled label="Hauteur ligne (px)">
          <input
            type="number"
            className={numInput}
            value={draft.rowHeight}
            onChange={(e) => set("rowHeight", Number(e.target.value))}
          />
        </Labeled>
        <Labeled label="Max items">
          <input
            type="number"
            className={numInput}
            value={draft.maxItems}
            onChange={(e) => set("maxItems", Number(e.target.value))}
          />
        </Labeled>
      </div>
      <div className="space-y-2 rounded-lg border border-border p-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted">Sous-champs</span>
          <button
            type="button"
            onClick={addSub}
            className="rounded border border-border px-2 py-0.5 text-xs hover:border-accent"
          >
            + Sous-champ
          </button>
        </div>
        {draft.subfields.map((sub, index) => (
          <div key={index} className="grid grid-cols-2 gap-2">
            <input
              className={numInput}
              placeholder="clé"
              value={sub.key}
              onChange={(e) => updateSub(index, { key: e.target.value })}
            />
            <input
              className={numInput}
              placeholder="label"
              value={sub.label}
              onChange={(e) => updateSub(index, { label: e.target.value })}
            />
            <select
              className={numInput}
              value={sub.type}
              onChange={(e) =>
                updateSub(index, {
                  type: e.target.value as "text" | "number",
                })
              }
            >
              <option value="text">text</option>
              <option value="number">number</option>
            </select>
            <input
              type="number"
              className={numInput}
              placeholder="offsetX"
              value={sub.offsetX}
              onChange={(e) =>
                updateSub(index, { offsetX: Number(e.target.value) })
              }
            />
            <input
              type="number"
              className={numInput}
              placeholder="fontSize"
              value={sub.fontSize}
              onChange={(e) =>
                updateSub(index, { fontSize: Number(e.target.value) })
              }
            />
            <select
              className={numInput}
              value={sub.fontFamily ?? DEFAULT_FONT_FAMILY}
              onChange={(e) =>
                updateSub(index, { fontFamily: e.target.value })
              }
            >
              {fontNames.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={sub.bold ?? false}
                onChange={(e) => updateSub(index, { bold: e.target.checked })}
              />
              Gras
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-8 w-10 rounded border border-border bg-surface"
                value={sub.color ?? "#ffffff"}
                onChange={(e) => updateSub(index, { color: e.target.value })}
              />
              <button
                type="button"
                onClick={() => removeSub(index)}
                className="text-xs text-muted hover:text-red-400"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

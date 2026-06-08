"use client";

import { useRef, useState } from "react";
import { DEFAULT_FONT_FAMILY } from "@/lib/canvas";
import { useAvailableFonts } from "@/lib/hooks/use-available-fonts";
import { uploadImageFile } from "@/lib/upload-image";
import type {
  Field,
  FieldValues,
  FieldStyleOverride,
  ImageField,
  ListField,
  ListItem,
  NumberField,
  StyleOverrides,
  TextField,
} from "@/lib/types";

export interface DynamicFormProps {
  fields: Field[];
  values: FieldValues;
  overrides: StyleOverrides;
  onValueChange: (key: string, value: FieldValues[string]) => void;
  onOverrideChange: (key: string, override: FieldStyleOverride) => void;
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent";
const labelClass = "text-sm font-medium";

function Customizer({
  overrideKey,
  override,
  defaultColor,
  defaultFont,
  defaultBold,
  fontNames,
  onChange,
}: {
  overrideKey: string;
  override: FieldStyleOverride | undefined;
  defaultColor: string;
  defaultFont: string;
  defaultBold: boolean;
  fontNames: string[];
  onChange: (key: string, override: FieldStyleOverride) => void;
}) {
  const [open, setOpen] = useState(false);
  const bold = override?.bold ?? defaultBold;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-muted hover:text-foreground"
        title="Personnaliser couleur, police et gras"
      >
        Aa
      </button>
      {open ? (
        <div className="absolute right-0 z-10 mt-1 w-56 space-y-2 rounded-lg border border-border bg-surface p-3 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted">Couleur</span>
            <input
              type="color"
              value={override?.color ?? defaultColor}
              onChange={(e) =>
                onChange(overrideKey, { ...override, color: e.target.value })
              }
              className="h-7 w-10 cursor-pointer rounded border border-border bg-transparent"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted">Police</span>
            <select
              value={override?.fontFamily ?? defaultFont}
              onChange={(e) =>
                onChange(overrideKey, {
                  ...override,
                  fontFamily: e.target.value,
                })
              }
              className={inputClass}
            >
              {fontNames.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={bold}
              onChange={(e) =>
                onChange(overrideKey, { ...override, bold: e.target.checked })
              }
            />
            Gras
          </label>
        </div>
      ) : null}
    </div>
  );
}

function TextLikeInput({
  field,
  values,
  overrides,
  fontNames,
  onValueChange,
  onOverrideChange,
}: {
  field: TextField | NumberField;
  fontNames: string[];
} & Omit<DynamicFormProps, "fields">) {
  const value = values[field.key];
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label className={labelClass} htmlFor={field.key}>
          {field.label}
          {field.required ? <span className="text-accent"> *</span> : null}
        </label>
        <Customizer
          overrideKey={field.key}
          override={overrides[field.key]}
          defaultColor={field.color ?? "#ffffff"}
          defaultFont={field.fontFamily ?? DEFAULT_FONT_FAMILY}
          defaultBold={field.bold ?? false}
          fontNames={fontNames}
          onChange={onOverrideChange}
        />
      </div>
      <input
        id={field.key}
        type={field.type === "number" ? "number" : "text"}
        value={typeof value === "string" || typeof value === "number" ? value : ""}
        maxLength={field.type === "text" ? field.maxLength : undefined}
        min={field.type === "number" ? field.min : undefined}
        max={field.type === "number" ? field.max : undefined}
        onChange={(e) => onValueChange(field.key, e.target.value)}
        className={inputClass}
        placeholder={field.label}
      />
    </div>
  );
}

function ImageInput({
  field,
  values,
  onValueChange,
}: { field: ImageField } & Omit<DynamicFormProps, "fields">) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const value = values[field.key];
  const current = typeof value === "string" ? value : "";

  const displayLabel =
    field.layer === "background" ? "Photo de fond" : field.label;

  const handleFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadImageFile(file);
      onValueChange(field.key, url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Échec de l'upload.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1">
      <label className={labelClass}>
        {displayLabel}
        {field.required ? <span className="text-accent"> *</span> : null}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={current}
          onChange={(e) => onValueChange(field.key, e.target.value)}
          className={inputClass}
          placeholder={
            field.layer === "background"
              ? "URL de la photo de fond (https://…)"
              : "URL de l'image (https://…)"
          }
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="shrink-0 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm hover:border-accent disabled:opacity-50"
        >
          {uploading ? "…" : "Fichier"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>
      {uploadError ? (
        <p className="text-xs text-red-400">{uploadError}</p>
      ) : current.startsWith("http") ? (
        <p className="text-xs text-muted">Image hébergée (persistante).</p>
      ) : null}
    </div>
  );
}

function ListInput({
  field,
  values,
  overrides,
  fontNames,
  onValueChange,
  onOverrideChange,
}: {
  field: ListField;
  fontNames: string[];
} & Omit<DynamicFormProps, "fields">) {
  const raw = values[field.key];
  const items: ListItem[] = Array.isArray(raw) ? (raw as ListItem[]) : [];

  const updateItem = (index: number, subKey: string, val: string) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, [subKey]: val } : item,
    );
    onValueChange(field.key, next);
  };
  const addItem = () => {
    if (items.length >= field.maxItems) return;
    onValueChange(field.key, [...items, {}]);
  };
  const removeItem = (index: number) => {
    onValueChange(
      field.key,
      items.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <span className={labelClass}>
          {field.label}
          {field.required ? <span className="text-accent"> *</span> : null}
        </span>
        <span className="text-xs text-muted">
          {items.length}/{field.maxItems}
        </span>
      </div>

      {field.subfields.map((sub) => (
        <div key={sub.key} className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted">{sub.label}</span>
          <Customizer
            overrideKey={`${field.key}.${sub.key}`}
            override={overrides[`${field.key}.${sub.key}`]}
            defaultColor={sub.color ?? "#ffffff"}
            defaultFont={sub.fontFamily ?? DEFAULT_FONT_FAMILY}
            defaultBold={sub.bold ?? false}
            fontNames={fontNames}
            onChange={onOverrideChange}
          />
        </div>
      ))}

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex flex-wrap items-end gap-2 rounded-md bg-surface-2 p-2"
          >
            {field.subfields.map((sub) => (
              <div key={sub.key} className="flex-1 space-y-1">
                <span className="text-[11px] text-muted">{sub.label}</span>
                <input
                  type={sub.type === "number" ? "number" : "text"}
                  value={
                    typeof item[sub.key] === "string" ||
                    typeof item[sub.key] === "number"
                      ? item[sub.key]
                      : ""
                  }
                  onChange={(e) => updateItem(index, sub.key, e.target.value)}
                  className="w-full rounded border border-border bg-surface px-2 py-1 text-sm outline-none focus:border-accent"
                  placeholder={sub.label}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="rounded border border-border px-2 py-1 text-xs text-muted hover:text-red-400"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        disabled={items.length >= field.maxItems}
        className="w-full rounded-lg border border-dashed border-border py-2 text-sm text-muted hover:border-accent hover:text-foreground disabled:opacity-40"
      >
        + Ajouter
      </button>
    </div>
  );
}

type EditableField = Exclude<Field, { type: "shape" }>;

export function DynamicForm({ fields, ...rest }: DynamicFormProps) {
  const { names: fontNames } = useAvailableFonts();
  const editableFields = fields.filter(
    (f): f is EditableField => f.type !== "shape",
  );

  return (
    <div className="space-y-4">
      {editableFields.map((field) => {
        switch (field.type) {
          case "text":
          case "number":
            return (
              <TextLikeInput
                key={field.key}
                field={field}
                fontNames={fontNames}
                {...rest}
              />
            );
          case "image":
            return <ImageInput key={field.key} field={field} {...rest} />;
          case "list":
            return (
              <ListInput
                key={field.key}
                field={field}
                fontNames={fontNames}
                {...rest}
              />
            );
        }
      })}
    </div>
  );
}
